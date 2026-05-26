// Fetches the planning origin of a card for the card detail modal's
// "ที่มา" section. Backend responds with JSON `null` (not 404) when the
// card wasn't promoted from planning, so the loaded state has three
// possible values: undefined (still loading), null (no source), or the
// CardSource object.
import { useEffect, useState } from "react";
import { planningApi } from "@/lib/planningApi";
import type { CardSource } from "@/types/planning";

interface State {
  source: CardSource | null | undefined;
  isLoading: boolean;
}

export function useCardSource(cardId: string | null): State {
  const [source, setSource] = useState<CardSource | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!cardId) {
      setSource(undefined);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    planningApi
      .getCardSource(cardId)
      .then((result) => {
        if (!cancelled) setSource(result);
      })
      .catch(() => {
        // Treat fetch failure as "no source" so the modal stays usable.
        // Real auth/network issues already surface via apiClient toasts.
        if (!cancelled) setSource(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  return { source, isLoading };
}
