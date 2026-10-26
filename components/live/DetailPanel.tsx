"use client";

import { useState } from "react";
import { STATUS_LABEL, coordText } from "@/lib/data";
import { useFleet } from "@/lib/store";

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="row">
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

export default function DetailPanel() {
  const v = useFleet((s) => s.vehicles.find((x) => x.id === s.selectedId));
  const [tab, setTab] = useState<"status" | "asset">("status");

  return (
    <>
      <div className="tabs" role="tablist">
        <button className="tab" role="tab" type="button" aria-selected={tab === "status"} onClick={() => setTab("status")}>
          Device status
        </button>
        <button className="tab" role="tab" type="button" aria-selected={tab === "asset"} onClick={() => setTab("asset")}>
          Asset info
        </button>
      </div>
      <div className="detail">
        {!v && <div className="empty">Select a vehicle.</div>}
        {v && (
          <>
            <div className="vname">
              {v.name}
              <small>
                {v.group} · {STATUS_LABEL[v.status]}
              </small>
            </div>
            {tab === "status" ? (
              <>
                <div className="sec">Device status</div>
                <dl>
                  <Row k="Coordinate" v={coordText(v)} />
                  <Row k="Geofence" v="None" />
                  <Row k="Route status" v="-" />
                  <Row k="Driver" v={v.driver} />
                  <Row k="Speed" v={`${v.speed} km/h`} />
                  <Row k="Ignition" v={v.acc} />
                  <Row k="Fuel level" v={`${v.fuel} %`} />
                  <Row k="Ext voltage" v={`${v.volt} V`} />
                </dl>
              </>
            ) : (
              <>
                <div className="sec">Device info</div>
                <dl>
                  <Row k="Device #" v={v.device} />
                  <Row k="Device type" v="GS" />
                  <Row k="Device model" v={v.model} />
                  <Row k="SIM #" v={v.sim} />
                </dl>
                <div className="sec">Asset info</div>
                <dl>
                  <Row k="Vehicle" v={v.plate} />
                  <Row k="Colour" v={v.color} />
                  <Row k="Model" v={String(v.year)} />
                  <Row k="Brand" v={v.brand} />
                  <Row k="Accessories" v="Fuel sensor" />
                  <Row k="Mileage" v={`${v.mileage.toFixed(1)} km`} />
                </dl>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
