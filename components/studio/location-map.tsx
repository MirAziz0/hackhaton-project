"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BAKU_CENTER } from "@/lib/places";
import { formatAZN } from "@/lib/utils";
import type { LocationSuggestion } from "@/types/database";

// Numbered pin drawn with CSS, which avoids Leaflet's default marker image assets.
function numberedIcon(index: number) {
  return L.divIcon({
    className: "",
    html: `<div class="map-pin">${index + 1}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function FitToMarkers({ locations }: { locations: LocationSuggestion[] }) {
  const map = useMap();
  useEffect(() => {
    if (!locations.length) return;
    const bounds = L.latLngBounds(locations.map((location) => [location.lat, location.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [map, locations]);
  return null;
}

export default function LocationMap({ locations }: { locations: LocationSuggestion[] }) {
  return (
    // "isolate" keeps Leaflet's high z-indexes below the sidebar and the chat widget.
    <div className="isolate h-[420px] overflow-hidden rounded-xl border">
      <MapContainer
        center={[BAKU_CENTER.lat, BAKU_CENTER.lng]}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((location, index) => (
          <Marker key={location.name} position={[location.lat, location.lng]} icon={numberedIcon(index)}>
            <Popup>
              <strong>{location.name}</strong>
              <br />
              Təxmini icarə: {formatAZN(location.estimated_rent_azn)} / ay
              <br />
              Uyğunluq: {location.fit_score}/100
            </Popup>
          </Marker>
        ))}
        <FitToMarkers locations={locations} />
      </MapContainer>
    </div>
  );
}
