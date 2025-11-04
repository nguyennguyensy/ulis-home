import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const Map = ({ 
  center = { lat: 21.0285, lng: 105.8542 }, 
  zoom = 13,
  markers = [],
  onLocationSelect,
  selectedLocation,
  height = '400px',
  interactive = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([center.lat, center.lng], zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add click handler for location selection
    if (interactive && onLocationSelect) {
      map.on('click', (e) => {
        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center.lat, center.lng, zoom, interactive, onLocationSelect]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = L.marker([markerData.lat, markerData.lng])
        .addTo(mapInstanceRef.current);

      if (markerData.popup) {
        marker.bindPopup(markerData.popup);
      }

      if (markerData.onClick) {
        marker.on('click', () => markerData.onClick(markerData));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers]);

  // Update selected location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;

    const { lat, lng } = selectedLocation;
    
    // Remove previous selected marker
    if (markersRef.current.length > 0 && interactive) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    }

    // Add selected marker
    const marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        shadowSize: [41, 41]
      })
    }).addTo(mapInstanceRef.current);

    markersRef.current.push(marker);
    mapInstanceRef.current.setView([lat, lng], zoom);
  }, [selectedLocation, zoom, interactive]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      // Try Nominatim with Vietnamese preference first (helps Vietnamese POI names)
      const tryNominatim = async (lang) => {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&accept-language=${lang}&q=${encodeURIComponent(searchQuery)}`;
        const resp = await fetch(nominatimUrl);
        const data = await resp.json();
        return data;
      };

      let data = await tryNominatim('vi');
      if (!data || data.length === 0) {
        // fallback to English
        data = await tryNominatim('en');
      }

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const location = { lat: parseFloat(lat), lng: parseFloat(lon) };

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([location.lat, location.lng], 15);
        }

        if (onLocationSelect) {
          onLocationSelect(location);
        }
        return;
      }

      // If no result from Nominatim and Google API key is provided, fallback to Google Places Text Search (with language)
      const googleKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (googleKey) {
        try {
          // prefer Vietnamese then English
          const googleLang = 'vi';
          const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleKey}&language=${googleLang}`;
          const gResp = await fetch(googleUrl);
          const gData = await gResp.json();
          if (gData && gData.results && gData.results.length > 0) {
            const place = gData.results[0];
            const location = { lat: place.geometry.location.lat, lng: place.geometry.location.lng };
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([location.lat, location.lng], 15);
            }
            if (onLocationSelect) onLocationSelect(location);
            return;
          }
        } catch (gErr) {
          console.error('Google Places search failed', gErr);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      {interactive && onLocationSelect && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          gap: '8px',
          backgroundColor: 'white',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <input
            type="text"
            placeholder="Tìm kiếm (tiếng Việt / English)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown ={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              padding: '8px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              width: '250px'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <MapPin size={16} />
            Tìm
          </button>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
    </div>
  );
};

export default Map;