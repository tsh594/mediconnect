// Free Maps Service using OpenStreetMap and Leaflet
import L from 'leaflet';

// Fix for default markers in React - IMPORTANT
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

class FreeMapsService {
    constructor() {
        this.initialized = false;
        this.geocodingCache = new Map();
    }

    async initialize() {
        if (this.initialized) return true;

        try {
            // Load Leaflet CSS dynamically
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            this.initialized = true;
            console.log('✅ Free Maps service initialized (OpenStreetMap + Leaflet)');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Free Maps service:', error);
            return false;
        }
    }

    // Geocoding using OpenStreetMap Nominatim API (free)
    async geocodeLocation(location) {
        if (!location || location.trim() === '') {
            console.log('📍 No location provided, using default');
            return this.getFallbackCoordinates('New York, NY');
        }

        const cacheKey = `geocode-${location}`;

        // Check cache first
        if (this.geocodingCache.has(cacheKey)) {
            return this.geocodingCache.get(cacheKey);
        }

        try {
            console.log(`🗺️ Geocoding location: ${location}`);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'MedConnect Medical App/1.0',
                        'Accept-Language': 'en'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const result = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    address: data[0].display_name,
                    confidence: data[0].importance
                };

                // Cache the result
                this.geocodingCache.set(cacheKey, result);
                return result;
            } else {
                throw new Error('Location not found');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            return this.getFallbackCoordinates(location);
        }
    }

    // Reverse geocoding - coordinates to address
    async reverseGeocode(lat, lng) {
        const cacheKey = `reverse-${lat}-${lng}`;

        if (this.geocodingCache.has(cacheKey)) {
            return this.geocodingCache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'MedConnect Medical App/1.0',
                        'Accept-Language': 'en'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Reverse geocoding failed: ${response.status}`);
            }

            const data = await response.json();
            const result = {
                address: data.display_name,
                components: data.address
            };

            this.geocodingCache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, components: {} };
        }
    }

    // Calculate distance between two points (Haversine formula)
    calculateDistance(coord1, coord2, unit = 'km') {
        const R = unit === 'km' ? 6371 : 3959;
        const dLat = this.deg2rad(coord2.lat - coord1.lat);
        const dLon = this.deg2rad(coord2.lng - coord1.lng);

        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return {
            distance: parseFloat(distance.toFixed(2)),
            unit: unit,
            text: `${distance.toFixed(2)} ${unit}`
        };
    }

    // Estimate travel time based on distance and mode
    estimateTravelTime(distanceKm, mode = 'driving') {
        let speedKmh;

        switch (mode) {
            case 'driving':
                speedKmh = 40;
                break;
            case 'transit':
                speedKmh = 25;
                break;
            case 'walking':
                speedKmh = 5;
                break;
            default:
                speedKmh = 40;
        }

        const timeHours = distanceKm / speedKmh;
        const timeMinutes = Math.round(timeHours * 60);

        return {
            minutes: timeMinutes,
            text: timeMinutes < 60 ?
                `${timeMinutes} min` :
                `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}min`
        };
    }

    // Search for healthcare providers near location
    async searchHealthcareProviders(specialty, location, radiusKm = 10) {
        try {
            const locationCoords = await this.geocodeLocation(location);

            // In a real app, you would query a local database or use Overpass API
            // For now, we'll return enhanced mock data with coordinates
            const providers = await this.getMockHealthcareProviders(specialty, locationCoords, radiusKm);

            return providers.map(provider => ({
                ...provider,
                distance: this.calculateDistance(locationCoords, provider.coordinates),
                travelTime: this.estimateTravelTime(
                    this.calculateDistance(locationCoords, provider.coordinates).distance
                )
            }));
        } catch (error) {
            console.error('Healthcare provider search error:', error);
            return this.getFallbackHealthcareProviders(specialty, location);
        }
    }

    // Get current location using browser geolocation
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    reject(new Error(`Location access denied: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    // Create a Leaflet map instance
    createMap(containerId, center, zoom = 12) {
        if (!this.initialized) {
            throw new Error('Maps service not initialized');
        }

        const map = L.map(containerId).setView(center, zoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        return map;
    }

    // Add markers to map for healthcare providers
    addHealthcareMarkers(map, providers) {
        const markers = [];

        providers.forEach(provider => {
            if (provider.coordinates) {
                const marker = L.marker([provider.coordinates.lat, provider.coordinates.lng])
                    .addTo(map)
                    .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #2563eb;">${provider.name}</h3>
              <p style="margin: 4px 0; color: #666;">${provider.specialty}</p>
              <p style="margin: 4px 0; color: #666;">${provider.address}</p>
              <p style="margin: 4px 0; color: #059669;">⭐ ${provider.rating}/5</p>
              <p style="margin: 4px 0; color: #dc2626;">${provider.distance?.text || 'Distance not available'} away</p>
            </div>
          `);

                markers.push(marker);
            }
        });

        return markers;
    }

    // Add user location marker
    addUserLocationMarker(map, userLocation) {
        if (userLocation && userLocation.lat && userLocation.lng) {
            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: '<div style="background: #4f46e5; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            return L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                .addTo(map)
                .bindPopup('<strong>Your Location</strong>')
                .openPopup();
        }
        return null;
    }

    // Utility functions
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    getFallbackCoordinates(location) {
        // Common city coordinates as fallback
        const cityCoordinates = {
            'new york': { lat: 40.7128, lng: -74.0060 },
            'boston': { lat: 42.3601, lng: -71.0589 },
            'los angeles': { lat: 34.0522, lng: -118.2437 },
            'chicago': { lat: 41.8781, lng: -87.6298 },
            'houston': { lat: 29.7604, lng: -95.3698 },
            'philadelphia': { lat: 39.9526, lng: -75.1652 },
            'phoenix': { lat: 33.4484, lng: -112.0740 },
            'san antonio': { lat: 29.4241, lng: -98.4936 },
            'san diego': { lat: 32.7157, lng: -117.1611 },
            'dallas': { lat: 32.7767, lng: -96.7970 },
            'fairfax': { lat: 38.8462, lng: -77.3064 },
            'virginia': { lat: 37.4316, lng: -78.6569 }
        };

        const locationLower = location.toLowerCase();
        for (const [city, coords] of Object.entries(cityCoordinates)) {
            if (locationLower.includes(city)) {
                return { ...coords, address: `${city.charAt(0).toUpperCase() + city.slice(1)} (approximate)`, confidence: 0.5 };
            }
        }

        // Default to US center
        return { lat: 39.8283, lng: -98.5795, address: 'Central US (approximate)', confidence: 0.1 };
    }

    getMockHealthcareProviders(specialty, locationCoords, radiusKm) {
        // Enhanced mock data with realistic coordinates near the search location
        const baseProviders = [
            {
                id: 'osm-1',
                name: `${specialty} Center of ${this.getCityName(locationCoords)}`,
                specialty: specialty,
                address: `123 Medical Drive, ${this.getCityName(locationCoords)}`,
                coordinates: this.generateNearbyCoordinate(locationCoords, 2),
                rating: 4.5,
                totalReviews: 124,
                source: 'OpenStreetMap',
                verified: true,
                languages: ['English'] // Ensure languages array exists
            },
            {
                id: 'osm-2',
                name: `Community ${specialty} Clinic`,
                specialty: specialty,
                address: `456 Health Ave, ${this.getCityName(locationCoords)}`,
                coordinates: this.generateNearbyCoordinate(locationCoords, 3),
                rating: 4.2,
                totalReviews: 89,
                source: 'OpenStreetMap',
                verified: true,
                languages: ['English', 'Spanish']
            },
            {
                id: 'osm-3',
                name: `Metropolitan ${specialty} Associates`,
                specialty: specialty,
                address: `789 Care Boulevard, ${this.getCityName(locationCoords)}`,
                coordinates: this.generateNearbyCoordinate(locationCoords, 1.5),
                rating: 4.7,
                totalReviews: 203,
                source: 'OpenStreetMap',
                verified: true,
                languages: ['English', 'French']
            }
        ];

        return baseProviders.filter(provider => {
            const distance = this.calculateDistance(locationCoords, provider.coordinates);
            return distance.distance <= radiusKm;
        });
    }

    getFallbackHealthcareProviders(specialty, location) {
        return [
            {
                id: 'fallback-1',
                name: `${specialty} Specialists`,
                specialty: specialty,
                address: `123 Healthcare Drive, ${location}`,
                coordinates: this.getFallbackCoordinates(location),
                rating: 4.3,
                totalReviews: 0,
                source: 'Fallback Data',
                verified: false,
                distance: { distance: 2.5, unit: 'km', text: '2.50 km' },
                travelTime: { minutes: 8, text: '8 min' },
                languages: ['English'] // Ensure languages array exists
            }
        ];
    }

    generateNearbyCoordinate(center, maxDistanceKm) {
        // Generate random coordinates within maxDistanceKm of center
        const radius = maxDistanceKm / 111.32; // Approx km per degree
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radius;

        return {
            lat: center.lat + (Math.cos(angle) * distance),
            lng: center.lng + (Math.sin(angle) * distance)
        };
    }

    getCityName(coordinates) {
        // Simple city name mapping for mock data
        const cities = {
            '40.7128': 'New York',
            '42.3601': 'Boston',
            '34.0522': 'Los Angeles',
            '41.8781': 'Chicago',
            '38.8462': 'Fairfax',
            '37.4316': 'Virginia'
        };

        return cities[coordinates.lat.toFixed(4)] || 'the area';
    }
}

// Create singleton instance
const freeMapsService = new FreeMapsService();

export default freeMapsService;

// Helper function to check if maps are available
export const isMapsAvailable = () => {
    return typeof L !== 'undefined';
};