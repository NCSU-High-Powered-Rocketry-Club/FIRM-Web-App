import React, { useEffect, useRef, useState } from "react";
import { useFIRM } from "~/contexts/FIRMContext";
import type { FIRMPacket } from "firm-client";
import { World } from "~/view3d/world";
import { View3D } from "~/view3d/view3d";

export function View3DPanel() {
  const { latestPacket, isConnected } = useFIRM();

  const [isMovementEnabled, setMovementEnabled] = useState(false);

  const lastPktTs = useRef<number | null>(null);

  const appRef = useRef(null);

  const worldRef = useRef<World>(null);
  const view3DRef = useRef<View3D>(null);

  const onMovementClick = () => {
    if (view3DRef?.current == null) { return };
    const enabled = !isMovementEnabled;

    view3DRef.current.setMovementEnabled(enabled);

    setMovementEnabled(enabled);
  }

  const onZeroClick = () => {
    if (view3DRef?.current == null) { return };
    view3DRef.current.zero();
  }

  // Set View3D orientation and location from packet
  const processPacket = (pkt: FIRMPacket) => {
    if (view3DRef?.current == null) { return };

    const view3D = view3DRef.current;


    const qx = pkt.est_quaternion_x;
    const qy = pkt.est_quaternion_y;
    const qz = pkt.est_quaternion_z;
    const qw = pkt.est_quaternion_w;

    view3D.setQuaternion(qx, qy, qz, qw);

    const px = pkt.est_position_x_meters;
    const py = pkt.est_position_y_meters;
    const pz = pkt.est_position_z_meters;

    const scale = 1;

    view3D.setPosition(px / scale, py / scale, pz / scale);
  };


  // Process new packet
  useEffect(() => {
    if (!latestPacket) return;

    const ts = latestPacket.timestamp_seconds;
    if (lastPktTs.current === ts) return;
    lastPktTs.current = ts;

    processPacket(latestPacket);
  }, [latestPacket]);

  // Create world and view3D on initialization
  useEffect(() => {
    const appElem = appRef.current;
    if (appElem != null && worldRef.current == null) {
      const world = new World(appElem, window.innerWidth / 2, window.innerWidth / 3);
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
        <div className="col-span-1 md:col-span-2 flex flex-row gap-x-5 justify-between rounded-lg border border-transparent bg-white">
          <button
            onClick={onMovementClick}
            type="submit"
            disabled={!isConnected}
            className="inline-flex items-center gap-1 rounded-md border border-transparent bg-theme px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-theme-dark focus:outline-none focus:ring-2 focus:ring-theme focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isMovementEnabled ? "Disable Movement" : "Enable Movement"}</span>
          </button>
          <button
            onClick={onZeroClick}
            type="submit"
            disabled={!isConnected}
            className="inline-flex items-center gap-1 rounded-md border border-transparent bg-theme px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-theme-dark focus:outline-none focus:ring-2 focus:ring-theme focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{"Set Orientation Zero"}</span>
          </button>
        </div>
      </h2>


      <div ref={appRef} style={{ display: 'flex', justifyContent: 'center', zIndex: 100 }}>
      </div>
    </section>
  );
}
