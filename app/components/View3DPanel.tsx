import React, { useEffect, useRef, useState } from "react";
import { useFIRM } from "~/contexts/FIRMContext";
import type { FIRMPacket } from "firm-client";
import { World } from "~/three-utils/world";
import { View3D } from "~/three-utils/view3d";

// const REFRESH_RATE_MS: number = 60;

export function View3DPanel() {
  const { latestPacket } = useFIRM();

  const lastPktTs = useRef<number | null>(null);

  const appRef = useRef(null);

  const worldRef = useRef<World>(null);
  const view3DRef = useRef<View3D>(null);

  const processPacket = (pkt: FIRMPacket) => {
    const view3D = view3DRef.current;

    if (view3DRef == null) { return };

    const x = pkt.est_quaternion_x;
    const y = pkt.est_quaternion_y;
    const z = pkt.est_quaternion_z;
    const w = pkt.est_quaternion_w;

    // @ts-expect-error
    view3D.setQuaternion(x, y, z, w);
  };


  // Append a point whenever the latest packet changes
  useEffect(() => {
    if (!latestPacket) return;

    const ts = latestPacket.timestamp_seconds;
    if (lastPktTs.current === ts) return;
    lastPktTs.current = ts;

    processPacket(latestPacket);
  }, [latestPacket]);

  // Render throttle independent of packet arrival rate
  useEffect(() => {
    const appElem = appRef.current;
    if (appElem != null && worldRef.current == null) {
      const world = new World(appElem, window.innerWidth / 3, window.innerWidth / 3);
      const view3D = new View3D(world);
      world.addSystem(view3D);
      world._animate();
      worldRef.current = world;
      view3DRef.current = view3D;
    }
  }, []);

  return (
    <section className="mt-4 rounded-xl border border-slate-300 bg-white px-6 pt-3.5 pb-4 shadow-sm text-slate-900">
      <h2 className="mb-3 text-lg font-semibold leading-tight flex justify-between items-center">
        <span>Live View</span>
      </h2>

      <div ref={appRef} style={{ display: 'flex', justifyContent: 'center', zIndex: 100 }}>
      </div>
    </section>
  );
}
