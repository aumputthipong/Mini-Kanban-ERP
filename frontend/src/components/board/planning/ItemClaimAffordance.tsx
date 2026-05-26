"use client";

// ItemClaimAffordance — the tri-state claim UI in the row's indicator
// area. Extracted from ItemRow during the polish pass; the three branches
// (free / own claim / other's claim) each had their own button + tooltip
// + className soup, and inlining them was making the row's render hard
// to scan.
//
// Hidden entirely on promoted items — claim on a card-equivalent is
// meaningless, the parent row simply doesn't render this when the item's
// status is "promoted".
import { Eye, EyeOff } from "lucide-react";

interface Props {
  claimedByUserId: string | null;
  isClaimedByMe: boolean;
  claimerName: string;
  claimedAt: string | null;
  // canForceRelease enables the moderation path — owner/manager can clear
  // someone else's claim (the backend's DELETE /claim accepts both own
  // and force-release in the same endpoint, gated by board role).
  canForceRelease: boolean;
  onClaim: () => void;
  onRelease: () => void;
}

export function ItemClaimAffordance({
  claimedByUserId,
  isClaimedByMe,
  claimerName,
  claimedAt,
  canForceRelease,
  onClaim,
  onRelease,
}: Props) {
  if (claimedByUserId === null) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClaim();
        }}
        title="claim ข้อนี้ไว้ดูก่อน"
        aria-label="ฉันจะดูข้อนี้"
        className="inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 opacity-60 transition-opacity hover:bg-slate-100 hover:opacity-100"
      >
        <Eye size={10} /> ฉันจะดู
      </button>
    );
  }

  // Claimed by someone. Three branches:
  //   - own claim → click releases
  //   - other's claim + I'm owner/manager → click force-releases (moderation)
  //   - other's claim + I'm a regular member → display-only
  // The "force release" path looks the same as the disabled-display path
  // except it's interactive on hover and shows a moderator-specific
  // tooltip. Keeping the same shape avoids re-flowing the row when role
  // changes around the user.
  const clickable = isClaimedByMe || canForceRelease;
  const ownTooltip = `กำลังดูอยู่${claimedAt ? " · " + new Date(claimedAt).toLocaleTimeString("th-TH") : ""} · คลิกเพื่อเลิกดู`;
  const forceTooltip = `${claimerName} กำลังดูอยู่ · คลิกเพื่อบังคับเลิก (manager/owner)`;
  const readOnlyTooltip = `${claimerName} กำลังดูอยู่`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (clickable) onRelease();
      }}
      disabled={!clickable}
      title={
        isClaimedByMe ? ownTooltip : canForceRelease ? forceTooltip : readOnlyTooltip
      }
      aria-label={
        isClaimedByMe
          ? "เลิกดู"
          : canForceRelease
            ? `บังคับเลิก ${claimerName} กำลังดู`
            : `${claimerName} กำลังดู`
      }
      className={`inline-flex shrink-0 items-center gap-1 rounded-full pr-1 text-[10px] font-semibold transition-colors ${
        isClaimedByMe
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : canForceRelease
            ? "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
            : "bg-slate-100 text-slate-600 cursor-not-allowed"
      }`}
    >
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
          isClaimedByMe
            ? "bg-emerald-200 text-emerald-800"
            : "bg-slate-300 text-slate-700"
        }`}
      >
        {(claimerName || "?").slice(0, 1).toUpperCase()}
      </span>
      {isClaimedByMe ? (
        <span className="inline-flex items-center gap-0.5">
          <EyeOff size={9} /> เลิกดู
        </span>
      ) : canForceRelease ? (
        <span className="inline-flex items-center gap-0.5 pr-1">
          <EyeOff size={9} /> ดูอยู่
        </span>
      ) : (
        <span className="pr-1">ดูอยู่</span>
      )}
    </button>
  );
}
