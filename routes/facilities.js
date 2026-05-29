const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/facilities — search nearby healthcare facilities via Overpass API (OpenStreetMap)
router.get('/', auth, async (req, res) => {
  try {
    const { lat, lng, type = 'hospital', radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const overpassQuery = `
      [out:json][timeout:50];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        way["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="clinic"](around:${radius},${lat},${lng});
        way["amenity"="clinic"](around:${radius},${lat},${lng});
        node["amenity"="pharmacy"](around:${radius},${lat},${lng});
        way["amenity"="pharmacy"](around:${radius},${lat},${lng});
        node["healthcare"="hospital"](around:${radius},${lat},${lng});
        way["healthcare"="hospital"](around:${radius},${lat},${lng});
        node["healthcare"="clinic"](around:${radius},${lat},${lng});
        way["healthcare"="clinic"](around:${radius},${lat},${lng});
      );
      out center body;
    `;

    let response;
    try {
      response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        `data=${encodeURIComponent(overpassQuery)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }
      );
    } catch {
      console.warn('Primary Overpass failed, trying mirror...');
      response = await axios.post(
        'https://lz4.overpass-api.de/api/interpreter',
        `data=${encodeURIComponent(overpassQuery)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }
      );
    }

    const elements = response.data.elements || [];

    const facilities = elements.map(el => {
      const elLat = el.lat || (el.center && el.center.lat);
      const elLng = el.lon || (el.center && el.center.lon);
      const tags = el.tags || {};
      const amenity = tags.amenity || tags.healthcare || 'hospital';
      const distance = calculateDistance(parseFloat(lat), parseFloat(lng), elLat, elLng);

      return {
        id: el.id,
        name: tags.name || tags['name:en'] || 'Healthcare Facility',
        type: amenity,
        address: buildAddress(tags),
        phone: tags.phone || tags['contact:phone'] || '',
        website: tags.website || tags['contact:website'] || '',
        emergency: tags.emergency === 'yes',
        openingHours: tags.opening_hours || 'Not specified',
        lat: elLat,
        lng: elLng,
        distance: distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`,
        distanceValue: distance,
        mapsLink: `https://www.openstreetmap.org/?mlat=${elLat}&mlon=${elLng}#map=17/${elLat}/${elLng}`,
        directionsLink: `https://www.google.com/maps/dir/?api=1&destination=${elLat},${elLng}`,
        operator: tags.operator || '',
      };
    }).filter(f => f.lat && f.lng);

    facilities.sort((a, b) => a.distanceValue - b.distanceValue);
    res.json(facilities.slice(0, 40));
  } catch (error) {
    console.error('Facility search error:', error.message);
    res.status(500).json({ message: 'Failed to search facilities' });
  }
});

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

function buildAddress(tags) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:postcode'],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : (tags.address || 'Address not available');
}

module.exports = router;
