// /frontend/src/app/dashboard/components/SyncUserComponent.tsx
'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SyncUserEffect() {
  const pathname = usePathname();

  useEffect(() => {
    const SYNC_INTERVAL_MS = 60_000; // 1 minute
    const lastSynced = localStorage.getItem("lastUserSync");
    const now = Date.now();

    const shouldSync =
      !lastSynced || now - Number(lastSynced) > SYNC_INTERVAL_MS;

    if (shouldSync) {
      const syncUser = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/users/sync", {
            credentials: "include",
          });

          if (res.ok) {
            localStorage.setItem("lastUserSync", String(now));
          } else {
            console.warn("User sync failed with status", res.status);
          }
        } catch (err) {
          console.warn("User sync error:", err);
        }
      };

      syncUser();
    }
  }, [pathname]);

  return null;
}
