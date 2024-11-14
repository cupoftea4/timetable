declare global {
  interface Window {
    APP_VERSION: string;
    gtag: (event: string, actions: string, obj: object) => void;
  }
}

export {};
