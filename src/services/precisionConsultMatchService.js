import { GoogleGenAI } from '@google/genai';

// Initialize Google AI
const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

// Mock doctor database - In a real app, this would come from your backend
const doctorDatabase = [
    {
        id: 1,
        name: "Dr. Sarah Chen",
        specialty: "Cardiology",
        subSpecialty: "Interventional Cardiology",
        experience: 15,
        rating: 4.9,
        hospital: "Metropolitan Heart Center",
        location: "New York, NY",
        languages: ["English", "Mandarin"],
        education: ["Harvard Medical School", "Johns Hopkins Cardiology Fellowship"],
        conditions: ["Coronary Artery Disease", "Heart Failure", "Arrhythmias", "Hypertension"],
        procedures: ["Angioplasty", "Stent Placement", "Cardiac Catheterization"],
        availability: "Next 3 days",
        consultationFee: 250,
        insurance: ["Aetna", "Blue Cross", "UnitedHealthcare"],
        telemedicine: true
    },
    {
        id: 2,
        name: "Dr. Michael Rodriguez",
        specialty: "Neurology",
        subSpecialty: "Stroke Neurology",
        experience: 12,
        rating: 4.8,
        hospital: "University Neurological Institute",
        location: "Boston, MA",
        languages: ["English", "Spanish"],
        education: ["Mayo Medical School", "Mass General Neurology Residency"],
        conditions: ["Stroke", "Migraine", "Epilepsy", "Multiple Sclerosis"],
        procedures: ["EEG", "EMG", "Nerve Conduction Studies"],
        availability: "Next week",
        consultationFee: 300,
        insurance: ["Blue Cross", "Cigna", "Medicare"],
        telemedicine: true
    },
    {
        id: 3,
        name: "Dr. Emily Watson",
        specialty: "Orthopedics",
        subSpecialty: "Sports Medicine",
        experience: 10,
        rating: 4.7,
        hospital: "Sports Medicine Center",
        location: "Los Angeles, CA",
        languages: ["English", "French"],
        education: ["Stanford Medical School", "UCLA Orthopedic Surgery Residency"],
        conditions: ["ACL Tears", "Rotator Cuff Injuries", "Fractures", "Arthritis"],
        procedures: ["Arthroscopic Surgery", "Joint Replacement", "Sports Injury Repair"],
        availability: "Next 2 days",
        consultationFee: 275,
        insurance: ["Aetna", "UnitedHealthcare", "Blue Shield"],
        telemedicine: false
    },
    {
        id: 4,
        name: "Dr. James Kim",
        specialty: "Gastroenterology",
        subSpecialty: "Hepatology",
        experience: 18,
        rating: 4.9,
        hospital: "Digestive Health Institute",
        location: "Chicago, IL",
        languages: ["English", "Korean"],
        education: ["Northwestern Medical School", "Cleveland Clinic Gastroenterology Fellowship"],
        conditions: ["IBD", "Liver Disease", "GERD", "Pancreatitis"],
        procedures: ["Colonoscopy", "Endoscopy", "Liver Biopsy"],
        availability: "Next 5 days",
        consultationFee: 320,
        insurance: ["Blue Cross", "Aetna", "Cigna", "Medicaid"],
        telemedicine: true
    },
    {
        id: 5,
        name: "Dr. Maria Garcia",
        specialty: "Pediatrics",
        subSpecialty: "Pediatric Cardiology",
        experience: 14,
        rating: 4.8,
        hospital: "Children's Medical Center",
        location: "Houston, TX",
        languages: ["English", "Spanish", "Portuguese"],
        education: ["Baylor College of Medicine", "Boston Children's Hospital Fellowship"],
        conditions: ["Congenital Heart Defects", "Pediatric Arrhythmias", "Childhood Hypertension"],
        procedures: ["Pediatric Echocardiography", "Fetal Cardiology"],
        availability: "Next week",
        consultationFee: 280,
        insurance: ["Blue Cross", "UnitedHealthcare", "Medicaid"],
        telemedicine: true
    },
    {
        id: 6,
        name: "Dr. Robert Thompson",
        specialty: "Oncology",
        subSpecialty: "Medical Oncology",
        experience: 20,
        rating: 4.9,
        hospital: "Cancer Treatment Center",
        location: "Philadelphia, PA",
        languages: ["English"],
        education: ["University of Pennsylvania Medical School", "MD Anderson Cancer Center Fellowship"],
        conditions: ["Breast Cancer", "Lung Cancer", "Colon Cancer", "Lymphoma"],
        procedures: ["Chemotherapy", "Immunotherapy", "Targeted Therapy"],
        availability: "Next 4 days",
        consultationFee: 350,
        insurance: ["Aetna", "Blue Cross", "Cigna", "Medicare"],
        telemedicine: true
    },
    {
        id: 7,
        name: "Dr. Jennifer Lee",
        specialty: "Dermatology",
        subSpecialty: "Cosmetic Dermatology",
        experience: 11,
        rating: 4.7,
        hospital: "Skin Health Institute",
        location: "Miami, FL",
        languages: ["English", "Mandarin", "Spanish"],
        education: ["University of Miami Medical School", "NYU Dermatology Residency"],
        conditions: ["Acne", "Psoriasis", "Skin Cancer", "Aging Skin"],
        procedures: ["Laser Therapy", "Botox", "Chemical Peels", "Skin Cancer Surgery"],
        availability: "Next 2 days",
        consultationFee: 295,
        insurance: ["Aetna", "Blue Cross", "UnitedHealthcare"],
        telemedicine: true
    },
    {
        id: 8,
        name: "Dr. David Wilson",
        specialty: "Psychiatry",
        subSpecialty: "Addiction Psychiatry",
        experience: 16,
        rating: 4.8,
        hospital: "Mental Health Center",
        location: "Seattle, WA",
        languages: ["English"],
        education: ["University of Washington Medical School", "Yale Psychiatry Residency"],
        conditions: ["Depression", "Anxiety", "Bipolar Disorder", "Substance Use"],
        procedures: ["Psychotherapy", "Medication Management", "TMS Therapy"],
        availability: "Next 3 days",
        consultationFee: 275,
        insurance: ["Blue Cross", "Cigna", "Kaiser", "Medicare"],
        telemedicine: true
    }
];

// Enhanced matching algorithm using AI
export const findMatchingDoctors = async (patientInfo, symptoms, preferences = {}) => {
    try {
        const {
            age,
            gender,
            location,
            insurance,
            condition,
            urgency = 'routine',
            telemedicinePreferred = false,
            languagePreferences = []
        } = patientInfo;

        // Step 1: Use AI to analyze symptoms and suggest specialties
        const specialtyAnalysis = await analyzeSymptomsForSpecialty(symptoms, condition, age, gender);

        // Step 2: Filter doctors based on AI-recommended specialties and other criteria
        let matchedDoctors = filterDoctors(
            specialtyAnalysis.recommendedSpecialties,
            {
                location,
                insurance,
                telemedicinePreferred,
                languagePreferences,
                urgency
            }
        );

        // Step 3: Score and rank doctors
        const scoredDoctors = scoreDoctors(matchedDoctors, patientInfo, specialtyAnalysis);

        // Step 4: Return top matches with AI explanation
        return {
            success: true,
            matches: scoredDoctors.slice(0, 5), // Top 5 matches
            analysis: specialtyAnalysis,
            totalMatches: scoredDoctors.length,
            searchCriteria: {
                symptoms,
                patientInfo,
                preferences
            }
        };

    } catch (error) {
        console.error('Error in findMatchingDoctors:', error);

        // Fallback to basic matching without AI
        return {
            success: false,
            matches: getFallbackMatches(patientInfo),
            analysis: {
                primarySpecialty: 'General Medicine',
                confidence: 'low',
                reasoning: 'Using basic matching due to AI service unavailability'
            },
            totalMatches: 3,
            fallback: true,
            error: error.message
        };
    }
};

// AI-powered symptom analysis
const analyzeSymptomsForSpecialty = async (symptoms, condition, age, gender) => {
    try {
        const prompt = `
As a medical specialist matching AI, analyze the following patient information and recommend the most appropriate medical specialties:

Patient Symptoms: ${symptoms}
Known Condition: ${condition || 'Not specified'}
Age: ${age || 'Not specified'}
Gender: ${gender || 'Not specified'}

Please provide:
1. Primary recommended specialty (most likely)
2. Secondary specialties to consider
3. Confidence level (high/medium/low)
4. Brief reasoning for the recommendation
5. Any red flags or urgent concerns

Format your response as JSON:
{
  "primarySpecialty": "specialty name",
  "secondarySpecialties": ["specialty1", "specialty2"],
  "confidence": "high/medium/low",
  "reasoning": "explanation",
  "urgency": "routine/urgent/emergency",
  "redFlags": ["flag1", "flag2"]
}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        const analysis = JSON.parse(response.text);
        return analysis;

    } catch (error) {
        console.error('AI analysis failed, using fallback:', error);
        return getFallbackSpecialtyAnalysis(symptoms);
    }
};

// Filter doctors based on multiple criteria
const filterDoctors = (recommendedSpecialties, filters) => {
    let filtered = doctorDatabase.filter(doctor => {
        // Match by specialty (primary or secondary)
        const specialtyMatch = recommendedSpecialties.includes(doctor.specialty) ||
            recommendedSpecialties.includes(doctor.subSpecialty);

        if (!specialtyMatch) return false;

        // Location filter (proximity-based in real app)
        if (filters.location && !isLocationCompatible(doctor.location, filters.location)) {
            return false;
        }

        // Insurance filter
        if (filters.insurance && !doctor.insurance.includes(filters.insurance)) {
            return false;
        }

        // Telemedicine preference
        if (filters.telemedicinePreferred && !doctor.telemedicine) {
            return false;
        }

        // Language preferences
        if (filters.languagePreferences.length > 0) {
            const languageMatch = filters.languagePreferences.some(lang =>
                doctor.languages.includes(lang)
            );
            if (!languageMatch) return false;
        }

        return true;
    });

    return filtered;
};

// Score and rank doctors based on multiple factors
const scoreDoctors = (doctors, patientInfo, analysis) => {
    return doctors.map(doctor => {
        let score = 0;
        const scoringFactors = [];

        // Specialty match (highest weight)
        if (doctor.specialty === analysis.primarySpecialty) {
            score += 30;
            scoringFactors.push('Primary specialty match: +30');
        } else if (analysis.secondarySpecialties.includes(doctor.specialty)) {
            score += 20;
            scoringFactors.push('Secondary specialty match: +20');
        }

        // Experience
        if (doctor.experience > 15) {
            score += 15;
            scoringFactors.push('High experience (>15 years): +15');
        } else if (doctor.experience > 10) {
            score += 10;
            scoringFactors.push('Good experience (>10 years): +10');
        } else {
            score += 5;
            scoringFactors.push('Standard experience: +5');
        }

        // Rating
        if (doctor.rating >= 4.8) {
            score += 15;
            scoringFactors.push('Excellent rating (≥4.8): +15');
        } else if (doctor.rating >= 4.5) {
            score += 10;
            scoringFactors.push('Good rating (≥4.5): +10');
        } else {
            score += 5;
            scoringFactors.push('Average rating: +5');
        }

        // Condition-specific experience
        if (patientInfo.condition && doctor.conditions.includes(patientInfo.condition)) {
            score += 20;
            scoringFactors.push('Condition-specific expertise: +20');
        }

        // Urgency matching
        if (analysis.urgency === 'urgent' && doctor.availability.includes('Next')) {
            const days = parseInt(doctor.availability.match(/\d+/)?.[0] || 7);
            if (days <= 3) {
                score += 10;
                scoringFactors.push('Quick availability for urgent case: +10');
            }
        }

        // Location proximity (simplified)
        if (patientInfo.location && isLocationCompatible(doctor.location, patientInfo.location)) {
            score += 8;
            scoringFactors.push('Location compatibility: +8');
        }

        // Language match
        if (patientInfo.languagePreferences && patientInfo.languagePreferences.some(lang =>
            doctor.languages.includes(lang))) {
            score += 7;
            scoringFactors.push('Language preference match: +7');
        }

        // Telemedicine availability
        if (patientInfo.telemedicinePreferred && doctor.telemedicine) {
            score += 5;
            scoringFactors.push('Telemedicine available: +5');
        }

        return {
            ...doctor,
            matchScore: score,
            matchPercentage: Math.min(100, Math.round((score / 110) * 100)),
            scoringFactors,
            aiConfidence: analysis.confidence
        };
    }).sort((a, b) => b.matchScore - a.matchScore);
};

// Helper function for location compatibility (simplified)
const isLocationCompatible = (doctorLocation, patientLocation) => {
    // In a real app, this would use geolocation and distance calculation
    const doctorState = doctorLocation.split(', ')[1];
    const patientState = patientLocation.split(', ')[1];
    return doctorState === patientState;
};

// Fallback functions
const getFallbackSpecialtyAnalysis = (symptoms) => {
    // Basic keyword matching for fallback
    const symptomLower = symptoms.toLowerCase();

    if (symptomLower.includes('chest') || symptomLower.includes('heart')) {
        return {
            primarySpecialty: 'Cardiology',
            secondarySpecialties: ['General Medicine', 'Emergency Medicine'],
            confidence: 'medium',
            reasoning: 'Based on symptom keywords',
            urgency: symptomLower.includes('pain') ? 'urgent' : 'routine',
            redFlags: []
        };
    } else if (symptomLower.includes('headache') || symptomLower.includes('neuro')) {
        return {
            primarySpecialty: 'Neurology',
            secondarySpecialties: ['General Medicine'],
            confidence: 'medium',
            reasoning: 'Based on symptom keywords',
            urgency: 'routine',
            redFlags: []
        };
    } else {
        return {
            primarySpecialty: 'General Medicine',
            secondarySpecialties: [],
            confidence: 'low',
            reasoning: 'General symptoms - starting with primary care',
            urgency: 'routine',
            redFlags: []
        };
    }
};

const getFallbackMatches = (patientInfo) => {
    // Return some general doctors as fallback
    return doctorDatabase
        .filter(doctor => doctor.specialty === 'General Medicine' || doctor.specialty === 'Family Medicine')
        .slice(0, 3)
        .map(doctor => ({
            ...doctor,
            matchScore: 50,
            matchPercentage: 50,
            scoringFactors: ['Fallback match'],
            aiConfidence: 'low'
        }));
};

// Additional utility functions
export const getDoctorDetails = (doctorId) => {
    return doctorDatabase.find(doctor => doctor.id === doctorId);
};

export const getSpecialtiesList = () => {
    const specialties = [...new Set(doctorDatabase.map(doctor => doctor.specialty))];
    return specialties.sort();
};

export const searchDoctorsBySpecialty = (specialty) => {
    return doctorDatabase.filter(doctor =>
        doctor.specialty === specialty ||
        doctor.subSpecialty === specialty
    );
};

export const scheduleConsultation = async (doctorId, patientInfo, appointmentDetails) => {
    // In a real app, this would integrate with a scheduling system
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                appointmentId: `APP-${Date.now()}-${doctorId}`,
                doctor: getDoctorDetails(doctorId),
                patientInfo,
                appointmentDetails,
                confirmationNumber: `CONF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                message: "Consultation scheduled successfully. You will receive a confirmation email shortly."
            });
        }, 1000);
    });
};

// Test function to verify service is working
export const testPrecisionMatchService = async () => {
    const testPatient = {
        age: 45,
        gender: 'male',
        location: 'New York, NY',
        insurance: 'Blue Cross',
        condition: 'Hypertension',
        symptoms: 'Chest pain and shortness of breath during exercise'
    };

    try {
        const result = await findMatchingDoctors(testPatient, testPatient.symptoms);
        console.log('Precision Match Service Test Result:', result);
        return result;
    } catch (error) {
        console.error('Precision Match Service Test Failed:', error);
        return { success: false, error: error.message };
    }
};