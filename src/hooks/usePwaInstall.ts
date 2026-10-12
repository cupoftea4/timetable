import { useSyncExternalStore } from "react";
import { APP_OPENS } from "@/utils/constants";
import useMediaQuery from "./useMediaQuery";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<unknown> };

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let installPrompt: BeforeInstallPromptEvent | undefined;
const listeners = new Set<() => void>();

function setInstallPrompt(event?: BeforeInstallPromptEvent) {
  installPrompt = event;
  for (const listener of listeners) listener();
}

// Chrome offers it once soon after load, so this module is imported at startup to not miss it
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  setInstallPrompt(event);
});
window.addEventListener("appinstalled", () => {
  setInstallPrompt();
  window.gtag("event", "pwa_installed", {});
});

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Safari has no install prompt, only "Add to Home Screen" in the share menu. iPads report themselves as Macs
const isIOS =
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

// Installing is suggested to people who keep coming back
const opens = Number(localStorage.getItem(APP_OPENS)) + 1;
localStorage.setItem(APP_OPENS, String(opens));
export const isReturningVisitor = opens >= 3;

export function promptInstall() {
  void installPrompt?.prompt();
  setInstallPrompt();
}

/** How the site can be installed here, nothing when it already runs installed */
export default function usePwaInstall(): "prompt" | "ios" | undefined {
  const canPrompt = useSyncExternalStore(subscribe, () => Boolean(installPrompt));
  const isInstalled = useMediaQuery("(display-mode: standalone)");
  if (isInstalled) return undefined;
  if (canPrompt) return "prompt";
  if (isIOS) return "ios";
  return undefined;
}
