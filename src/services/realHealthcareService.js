// realHealthcareService.js
export class RealHealthcareService {
    constructor() {
        this.betterDoctorApiKey = import.meta.env.VITE_BETTER_DOCTOR_API_KEY;
        this.healthgradesApiKey = import.meta.env.VITE_HEALTHGRADES_API_KEY;
    }

    async findRealDoctors(criteria, symptoms) {
        try {
            // Try BetterDoctor API first
            const doctors = await this.fetchFromBetterDoctor(criteria);

            if (doctors.length > 0) {
                return this.enhanceWithRealData(doctors, criteria);
            }

            // Fallback to Healthgrades API
            return await this.fetchFromHealthgrades(criteria);

        } catch (error) {
            console.error('Real healthcare API error:', error);
            return this.getEnhancedMockData(criteria, symptoms);
        }
    }

    async fetchFromBetterDoctor(criteria) {
        const response = await fetch(
            `https://api.betterdoctor.com/2016-03-01/doctors?location=${criteria.location}&skip=0&limit=10&user_key=${this.betterDoctorApiKey}`
        );

        const data = await response.json();

        return data.data.map(doctor => ({
            id: doctor.uid,
            name: `Dr. ${doctor.profile.first_name} ${doctor.profile.last_name}`,
            specialty: doctor.specialties[0]?.name || 'General Practice',
            address: doctor.practices[0]?.visit_address?.street,
            city: doctor.practices[0]?.visit_address?.city,
            state: doctor.practices[0]?.visit_address?.state,
            phone: doctor.practices[0]?.phones[0]?.number,
            bio: doctor.profile.bio,
            imageUrl: doctor.profile.image_url,
            rating: doctor.ratings?.[0]?.rating || 4.0,
            coordinates: {
                lat: doctor.practices[0]?.lat || 38.8462,
                lng: doctor.practices[0]?.lng || -77.3064
            }
        }));
    }
}