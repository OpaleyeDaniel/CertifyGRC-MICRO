import { useCallback, useState } from "react";

/** Minimal shared state for opening the platform evidence source picker (modal handles the rest). */
export function useEvidenceSourcePickerState(initial = false) {
  const [open, setOpen] = useState(initial);
  const openPicker = useCallback(() => setOpen(true), []);
  const closePicker = useCallback(() => setOpen(false), []);
  return { open, setOpen, openPicker, closePicker };
}
