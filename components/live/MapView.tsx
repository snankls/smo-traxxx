"use client";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { STATUS_COLOR, Vehicle } from "@/lib/data";
import { useFleet } from "@/lib/store";

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

function markerIcon(v: Vehicle, selected: boolean) {
  const label = selected ? `<span class="mk-label">${escapeHtml(v.name)}</span>` : "";
  return L.divIcon({
    className: "mk-wrap",
    html: `<div class="mk${selected ? " sel" : ""}" style="--c:${STATUS_COLOR[v.status]}"><span class="mk-dot"></span>${label}</div>`,
    iconSize: [0, 0],
  });
}

// The sidebars change the map's width. Leaflet must be told to re-measure.
function ResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function FollowSelected() {
  const map = useMap();
  const selectedId = useFleet((s) => s.selectedId);
  const follow = useFleet((s) => s.follow);
  useEffect(() => {
    if (!follow) return;
    const v = useFleet.getState().vehicles.find((x) => x.id === selectedId);
    if (v) map.flyTo([v.lat, v.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
  }, [map, selectedId, follow]);
  return null;
}

export default function MapView() {
  const { vehicles, checked, selectedId } = useFleet();
  const start = vehicles.find((v) => v.id === selectedId) ?? vehicles[0];

  return (
    <MapContainer center={[start.lat, start.lng]} zoom={13} zoomControl={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <ResizeWatcher />
      <FollowSelected />
      {vehicles
        .filter((v) => checked[v.id])
        .map((v) => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={markerIcon(v, v.id === selectedId)}
            zIndexOffset={v.id === selectedId ? 1000 : 0}
            eventHandlers={{ click: () => useFleet.getState().select(v.id) }}
          />
        ))}
    </MapContainer>
  );
}
