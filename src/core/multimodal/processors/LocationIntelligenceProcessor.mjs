// src/core/multimodal/processors/LocationIntelligenceProcessor.mjs
// Location Intelligence: Geocoding coordinates, place semantic context, and spatial awareness

export class LocationIntelligenceProcessor {
    /**
     * Processes location coordinates into place entities
     * @param {Object} params
     * @param {number} params.latitude
     * @param {number} params.longitude
     * @param {string} [params.name='']
     * @param {string} [params.address='']
     * @returns {Object} Location Analysis
     */
    static process({ latitude, longitude, name = '', address = '' }) {
        const placeName = name || (address ? address.split(',')[0] : `Coord (${latitude}, ${longitude})`);
        
        return {
            modality: 'LOCATION',
            coordinates: { latitude, longitude },
            placeName,
            address,
            extractedText: `Lokasi: ${placeName} (${address || 'GPS Coordinates'})`,
            placeEntity: {
                id: `loc_${latitude}_${longitude}`.replace(/\./g, '_'),
                name: placeName,
                type: 'LOCATION'
            },
            isUnderstood: typeof latitude === 'number' && typeof longitude === 'number'
        };
    }
}
