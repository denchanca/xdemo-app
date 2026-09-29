"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Accessibility } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ledgerly-contrast";

function applyContrast(on: boolean) {
  const root = document.documentElement;
  root.classList.toggle("contrast", on);
  const dark = root.classList.contains("dark");
  root.style.colorScheme = on ? "light" : dark ? "dark" : "light";
}

function readContrast(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function subscribe(onStoreChange: () => void) {
  const sync = () => {
    applyContrast(readContrast());
    onStoreChange();
  };
  window.addEventListener("storage", sync);
  window.addEventListener("ledgerly-contrast", sync);
  return () => {
    window.removeEventListener("storage", sync);
    window.removeEventListener("ledgerly-contrast", sync);
  };
}

export function ContrastToggle() {
  const on = useSyncExternalStore(subscribe, readContrast, () => false);

  useEffect(() => {
    applyContrast(readContrast());
  }, [on]);

  const toggle = useCallback(() => {
    const next = !on;
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    applyContrast(next);
    window.dispatchEvent(new Event("ledgerly-contrast"));
  }, [on]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={cn(
        "rounded-full p-2 hover:bg-muted hover:text-foreground",
        on ? "bg-foreground text-primary-foreground" : "text-muted-foreground",
      )}
      aria-label={on ? "Use standard appearance" : "High contrast appearance"}
      title={on ? "Standard appearance" : "High contrast"}
    >
      <Accessibility className="size-5" />
    </button>
  );
}
