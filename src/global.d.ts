declare global {
  interface Window {
    gtag: (event: string, actions: string, obj: object) => void;
  }
}

export {};
