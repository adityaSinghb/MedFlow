import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { INTAKE } from '../../constants/testIds/medflow';

// Fix default marker icons using CDN (avoids bundler asset issues)
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ latitude: +e.latlng.lat.toFixed(4), longitude: +e.latlng.lng.toFixed(4) });
    },
  });
  return null;
}

export default function IncidentMap({ value, onChange }) {
  const center = value || { latitude: 40.7580, longitude: -73.9855 };
  return (
    <div className="rounded-md overflow-hidden border border-border" data-testid={INTAKE.map}>
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: 220, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        {value && <Marker position={[value.latitude, value.longitude]} icon={markerIcon} />}
      </MapContainer>
    </div>
  );
}
