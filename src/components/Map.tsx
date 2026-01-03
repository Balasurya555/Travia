import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix missing marker icons issue in leaflet when bundled
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export type MapMarker = { id: string; name: string; lat: number; lng: number; popup?: string };

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  polyline?: [number, number][];
  height?: string;
}

export default function Map({ center = [20, 0], zoom = 2, markers = [], polyline = [], height = '400px' }: MapProps) {
  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>{m.popup || m.name}</Popup>
          </Marker>
        ))}
        {polyline && polyline.length > 0 && <Polyline positions={polyline} color="#3b82f6" />}
      </MapContainer>
    </div>
  );
}
