// ============================================================
// map.js — Facility Locator: direct Overpass API (browser-side)
// ============================================================
(() => {
  if (!API.requireAuth()) return;

  let map, markers = [], userMarker = null, rangeCircle = null;
  let currentRadius = 5000;

  const typeConfig = {
    hospital: { color: '#00d4aa', label: 'Hospital', icon: 'H' },
    clinic:   { color: '#4f9cf9', label: 'Clinic',   icon: 'C' },
    pharmacy: { color: '#f97316', label: 'Pharmacy', icon: 'P' },
  };

  function getConfig(type) {
    return typeConfig[type] || typeConfig.hospital;
  }

  // Init map with dark tile layer
  function initMap() {
    map = L.map('map', { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    document.getElementById('mapLoading').classList.add('hidden');
  }

  initMap();

  // Radius slider
  const slider   = document.getElementById('radiusSlider');
  const radiusLbl = document.getElementById('radiusValue');
  slider.addEventListener('input', () => {
    currentRadius = parseInt(slider.value);
    radiusLbl.textContent = (currentRadius / 1000) + ' km';
  });

  document.getElementById('searchBtn').addEventListener('click', searchFacilities);
  document.getElementById('logoutBtn')?.addEventListener('click', () => API.logout());

  // Manual coordinate search fallback
  document.getElementById('manualSearchBtn')?.addEventListener('click', async () => {
    const lat = parseFloat(document.getElementById('manualLat').value);
    const lng = parseFloat(document.getElementById('manualLng').value);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values.\n\nExample for New Delhi: Lat 28.6139, Lng 77.2090');
      return;
    }
    await runSearch(lat, lng);
  });

  async function fetchFromOverpass(lat, lng, radius) {
    const query = `
      [out:json][timeout:60];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        way["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="clinic"](around:${radius},${lat},${lng});
        way["amenity"="clinic"](around:${radius},${lat},${lng});
        node["amenity"="pharmacy"](around:${radius},${lat},${lng});
        way["amenity"="pharmacy"](around:${radius},${lat},${lng});
        node["healthcare"="hospital"](around:${radius},${lat},${lng});
        node["healthcare"="clinic"](around:${radius},${lat},${lng});
      );
      out center body;
    `;

    // Try multiple mirrors
    const mirrors = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];

    for (const url of mirrors) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(query),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        if (res.ok) {
          const data = await res.json();
          return data.elements || [];
        }
      } catch (e) {
        console.warn('Mirror failed:', url, e.message);
      }
    }
    throw new Error('All Overpass mirrors failed');
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function buildAddress(tags) {
    const parts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city'], tags['addr:state']].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : (tags.address || 'Address not available');
  }

  async function searchFacilities() {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser. Use the manual input below.'); return;
    }
    const btn = document.getElementById('searchBtn');
    btn.classList.add('loading'); btn.innerHTML = '<span>Getting location...</span>';

    navigator.geolocation.getCurrentPosition(
      async (pos) => { await runSearch(pos.coords.latitude, pos.coords.longitude); resetBtn(); },
      (err) => {
        console.warn('Geolocation denied:', err);
        alert('Location access was blocked.\n\nTo fix:\n1. Click the lock icon in your browser address bar\n2. Set Location to "Allow"\n3. Refresh the page\n\nOr use the manual coordinate input below.');
        resetBtn();
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function runSearch(lat, lng) {
    const btn = document.getElementById('searchBtn');
    btn.classList.add('loading'); btn.innerHTML = '<span>Searching...</span>';

    // User marker + range circle
    if (userMarker)  map.removeLayer(userMarker);
    if (rangeCircle) map.removeLayer(rangeCircle);

    userMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: '<div style="background:linear-gradient(135deg,#7c3aed,#ec4899);width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(124,58,237,0.5)"></div>',
        iconSize: [20, 20], className: '',
      })
    }).addTo(map).bindPopup('<strong>Your Location</strong>');

    rangeCircle = L.circle([lat, lng], {
      radius: currentRadius,
      color: '#00d4aa', fillColor: '#00d4aa', fillOpacity: 0.07, weight: 1.5,
    }).addTo(map);

    map.setView([lat, lng], 14);
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    try {
      const elements = await fetchFromOverpass(lat, lng, currentRadius);

      const facilities = elements.map(el => {
        const elLat = el.lat || (el.center && el.center.lat);
        const elLng = el.lon  || (el.center && el.center.lon);
        if (!elLat || !elLng) return null;
        const tags = el.tags || {};
        const type = tags.amenity || tags.healthcare || 'hospital';
        const dist = calculateDistance(lat, lng, elLat, elLng);
        return {
          name: tags.name || tags['name:en'] || 'Healthcare Facility',
          type,
          address: buildAddress(tags),
          phone: tags.phone || tags['contact:phone'] || '',
          emergency: tags.emergency === 'yes',
          lat: elLat, lng: elLng,
          distance: dist < 1 ? `${Math.round(dist*1000)}m` : `${dist.toFixed(1)}km`,
          distanceValue: dist,
          directionsLink: `https://www.google.com/maps/dir/?api=1&destination=${elLat},${elLng}`,
          mapsLink: `https://www.openstreetmap.org/?mlat=${elLat}&mlon=${elLng}#map=17/${elLat}/${elLng}`,
        };
      }).filter(Boolean);

      facilities.sort((a, b) => a.distanceValue - b.distanceValue);
      displayResults(facilities.slice(0, 40));
    } catch (err) {
      console.error('Search failed:', err);
      document.getElementById('resultsList').innerHTML =
        '<div style="text-align:center;padding:24px;color:#ff6b6b">Could not reach map data servers. Check your internet connection and try again.</div>';
    }
    resetBtn();
  }

  function resetBtn() {
    const btn = document.getElementById('searchBtn');
    btn.classList.remove('loading');
    btn.innerHTML = '<span>Search My Location</span>';
  }

  function displayResults(facilities) {
    const countEl = document.getElementById('resultsCount');
    const numEl   = document.getElementById('resultNum');
    const listEl  = document.getElementById('resultsList');

    countEl.style.display = 'block';
    numEl.textContent = facilities.length;

    if (facilities.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted)">No facilities found. Try increasing the search radius.</div>';
      return;
    }

    facilities.forEach(f => {
      const cfg = getConfig(f.type);
      const marker = L.marker([f.lat, f.lng], {
        icon: L.divIcon({
          html: `<div style="background:${cfg.color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#0a0f1e;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${cfg.icon}</div>`,
          iconSize: [32, 32], className: '',
        })
      }).addTo(map).bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:200px">
          <strong style="font-size:14px">${f.name}</strong><br>
          <span style="background:${cfg.color};color:#0a0f1e;font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;text-transform:uppercase">${cfg.label}</span><br><br>
          <span style="color:#555;font-size:12px">${f.distance} away</span><br>
          <span style="color:#555;font-size:12px">${f.address}</span><br>
          ${f.phone ? `<span style="font-size:12px">Tel: ${f.phone}</span><br>` : ''}
          ${f.emergency ? '<span style="color:#ff6b6b;font-size:12px;font-weight:bold">Emergency Available</span><br>' : ''}
          <a href="${f.directionsLink}" target="_blank" style="color:#00d4aa;font-size:12px">Get Directions</a>
        </div>
      `);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = L.featureGroup([...markers, userMarker].filter(Boolean));
      map.fitBounds(group.getBounds().pad(0.1));
    }

    listEl.innerHTML = facilities.map((f, i) => {
      const cfg = getConfig(f.type);
      return `
        <div class="result-card" onclick="flyTo(${f.lat},${f.lng})" id="result-${i}">
          <div class="result-name">
            ${f.name}
            <span style="background:${cfg.color};color:#0a0f1e;font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;margin-left:6px;text-transform:uppercase;vertical-align:middle">${cfg.label}</span>
          </div>
          <div class="result-meta">
            <span class="result-distance">${f.distance} away</span>
            <span>${f.address.substring(0,50)}${f.address.length>50?'...':''}</span>
            ${f.emergency ? '<span style="color:var(--accent-coral)">Emergency</span>' : ''}
          </div>
          <div class="result-links">
            <a href="${f.directionsLink}" target="_blank" class="result-link">Directions</a>
            <a href="${f.mapsLink}" target="_blank" class="result-link">View Map</a>
            ${f.phone ? `<a href="tel:${f.phone}" class="result-link">Call</a>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window.flyTo = (lat, lng) => {
    map.setView([lat, lng], 16);
    markers.forEach(m => {
      const p = m.getLatLng();
      if (Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001) m.openPopup();
    });
  };
})();
