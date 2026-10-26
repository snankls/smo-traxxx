"use client";

import { STATUS_COLOR, STATUS_LABEL, coordText } from "@/lib/data";
import { useFleet } from "@/lib/store";

export default function VehicleDock() {
  const { vehicles, checked, selectedId } = useFleet();
  const select = useFleet((s) => s.select);
  const rows = vehicles.filter((v) => checked[v.id]);

  return (
    <section className="dock" aria-label="Selected vehicles">
      <div className="dock-head">
        Vehicle info <span className="sub">{rows.length} shown on map</span>
      </div>
      <div className="dock-scroll">
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Status</th>
              <th>Speed</th>
              <th>Received</th>
              <th>GPS time</th>
              <th>Coordinates</th>
              <th>Mileage</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  Tick a vehicle in the list to show it on the map and here.
                </td>
              </tr>
            )}
            {rows.map((v) => (
              <tr key={v.id} className={`click${v.id === selectedId ? " sel" : ""}`} onClick={() => select(v.id)}>
                <td>{v.name}</td>
                <td>
                  <span className="pill" style={{ ["--c" as string]: STATUS_COLOR[v.status] }}>
                    <i />
                    {STATUS_LABEL[v.status]}
                  </span>
                </td>
                <td className="mono">{v.speed} km/h</td>
                <td className="mono">{v.received}</td>
                <td className="mono">{v.received}</td>
                <td className="mono">{coordText(v)}</td>
                <td className="mono">{v.mileage.toFixed(1)} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
