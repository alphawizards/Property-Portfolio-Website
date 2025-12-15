
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface UseAutoSaveOptions<T> {
  data: T;
  currentStep: number;
  propertyNickname?: string;
  enabled?: boolean;
  debounceMs?: number;
  onLoad?: (data: T, step: number) => void;
}

export function useAutoSave<T>({
  data,
  currentStep,
  propertyNickname,
  enabled = true,
  debounceMs = 2000,
  onLoad,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const saveMutation = trpc.propertyDraft.saveDraft.useMutation();
  const { data: draft } = trpc.propertyDraft.getDraft.useQuery(undefined, {
    enabled: enabled,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const hasLoadedRef = useRef(false);

  // Load draft on mount
  useEffect(() => {
    if (draft && !hasLoadedRef.current && onLoad) {
      try {
        const parsedData = typeof draft.data === 'string' ? JSON.parse(draft.data) : draft.data;
        onLoad(parsedData, draft.step);
        hasLoadedRef.current = true;
        toast.info("Draft loaded", {
          description: `Continuing with ${draft.propertyNickname || 'your draft'} at step ${draft.step}`,
        });
      } catch (e) {
        console.error("Failed to parse draft data", e);
      }
    }
  }, [draft, onLoad]);

  // Auto-save
  useEffect(() => {
    if (!enabled) return;

    // Don't save empty data on initial load before user interaction if we haven't loaded yet?
    // Actually we want to save even if they just start typing.

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (Object.keys(data as any).length > 0) {
        saveMutation.mutate({
          draftData: data,
          currentStep,
          propertyNickname,
        }, {
            onError: (err) => {
                console.error("Failed to auto-save draft", err);
            }
        });
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, currentStep, propertyNickname, enabled, debounceMs]);

  const clearDraft = trpc.propertyDraft.deleteDraft.useMutation();

  return {
    clearDraft: () => clearDraft.mutate(),
    isLoadingDraft: !draft && enabled, // Rough check
  };
}
