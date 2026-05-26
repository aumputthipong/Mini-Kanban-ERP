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
  onClaim: () => void;
  onRelease: () => void;
}

export function ItemClaimAffordance({
  claimedByUserId,
  isClaimedByMe,
  claimerName,
  claimedAt,
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

  // Claimed by someone — own claim is interactive (click to release);
  // other people's claims are display-only here. Manager force-release is
  // an API-only path right now (no UI exposed in the row); a moderator
  // affordance can land later without changing this component's surface.
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (isClaimedByMe) onRelease();
      }}
      disabled={!isClaimedByMe}
      title={
        isClaimedByMe
          ? `กำลังดูอยู่${claimedAt ? " · " + new Date(claimedAt).toLocaleTimeString("th-TH") : ""} · คลิกเพื่อเลิกดู`
          : `${claimerName} กำลังดูอยู่`
      }
      aria-label={isClaimedByMe ? "เลิกดู" : `${claimerName} กำลังดู`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full pr-1 text-[10px] font-semibold transition-colors ${
        isClaimedByMe
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
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
      ) : (
        <span className="pr-1">ดูอยู่</span>
      )}
    </button>
  );
}
