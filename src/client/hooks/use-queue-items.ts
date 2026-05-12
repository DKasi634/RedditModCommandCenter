import { useCallback, useEffect, useState } from "react";
import { fetchQueue } from "../api/queue-api";
import type { QueueResponse } from "../types/api";

export function useQueueItems() {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await fetchQueue());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load queue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, error, isLoading, refresh };
}
