"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/actions/wishlist";
import "@/app/wishlist.css";

/** Heart toggle on a listing card. Updates instantly, rolls back if the server says no. */
export function WishlistButton({ listingId, initial, addLabel, removeLabel }: {
  listingId: string; initial: boolean; addLabel: string; removeLabel: string;
}) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !on;
    setOn(next);
    start(async () => {
      const res = await toggleWishlistAction(listingId);
      if (!res.ok) {
        setOn(!next);
        if (res.code === "UNAUTHENTICATED") router.push("/login");
        return;
      }
      setOn(res.wishlisted);
      router.refresh();   // keeps the wishlist page in sync when a card is un-saved there
    });
  }

  return (
    <button
      type="button" className={`wl-btn${on ? " on" : ""}`} onClick={toggle} disabled={pending}
      aria-pressed={on} aria-label={on ? removeLabel : addLabel} title={on ? removeLabel : addLabel}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6 5c2 0 3.3 1 4.2 2.3h3.6C14.7 6 16 5 18 5c3.3 0 5.1 3.4 3.6 6.8C19.5 16.4 12 21 12 21z"
          fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
