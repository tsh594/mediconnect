import React, { useEffect, useRef } from 'react';
import freeMapsService from '../services/freeMapsService';

const MapComponent = ({ providers, center, zoom = 12, height = '400px', userLocation = null }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);
    const userMarkerRef = useRef(null);

    useEffect(() => {
        const initializeMap = async () => {
            try {
                await freeMapsService.initialize();

                if (mapRef.current && !mapInstance.current) {
                    console.log('🗺️ Creating Leaflet map...');

                    // Create map instance
                    mapInstance.current = freeMapsService.createMap(
                        mapRef.current,
                        center || [40.7128, -74.0060],
                        zoom
                    );

                    // Add user location marker if available
                    if (userLocation) {
                        userMarkerRef.current = freeMapsService.addUserLocationMarker(
                            mapInstance.current,
                            userLocation
                        );
                    }

                    // Add providers as markers
                    if (providers && providers.length > 0) {
                        markersRef.current = freeMapsService.addHealthcareMarkers(
                            mapInstance.current,
                            providers
                        );

                        // Fit map to show all markers
                        if (markersRef.current.length > 0) {
                            const group = new L.featureGroup(markersRef.current);
                            if (userMarkerRef.current) {
                                group.addLayer(userMarkerRef.current);
                            }
                            mapInstance.current.fitBounds(group.getBounds().pad(0.1));
                        }
                    }

                    console.log('✅ Leaflet map created successfully');
                }
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        };

        initializeMap();

        // Cleanup function
        return () => {
            if (mapInstance.current) {
                console.log('🗺️ Cleaning up map instance');
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Update markers when providers change
    useEffect(() => {
        if (mapInstance.current && providers && providers.length > 0) {
            console.log('🔄 Updating map markers...');

            // Remove existing markers
            markersRef.current.forEach(marker => {
                if (marker && mapInstance.current) {
                    mapInstance.current.removeLayer(marker);
                }
            });
            markersRef.current = [];

            // Add new markers
            markersRef.current = freeMapsService.addHealthcareMarkers(
                mapInstance.current,
                providers
            );

            // Fit map to show all markers
            if (markersRef.current.length > 0) {
                const group = new L.featureGroup(markersRef.current);
                if (userMarkerRef.current) {
                    group.addLayer(userMarkerRef.current);
                }
                mapInstance.current.fitBounds(group.getBounds().pad(0.1));
            }
        }
    }, [providers]);

    // Update user location
    useEffect(() => {
        if (mapInstance.current && userLocation) {
            // Remove existing user marker
            if (userMarkerRef.current) {
                mapInstance.current.removeLayer(userMarkerRef.current);
            }

            // Add new user marker
            userMarkerRef.current = freeMapsService.addUserLocationMarker(
                mapInstance.current,
                userLocation
            );

            // Re-fit bounds if we have providers
            if (markersRef.current.length > 0) {
                const group = new L.featureGroup(markersRef.current);
                if (userMarkerRef.current) {
                    group.addLayer(userMarkerRef.current);
                }
                mapInstance.current.fitBounds(group.getBounds().pad(0.1));
            }
        }
    }, [userLocation]);

    return (
        <div
            ref={mapRef}
            style={{
                height,
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
            }}
        />
    );
};

export default MapComponent;