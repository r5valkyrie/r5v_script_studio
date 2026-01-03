/**
 * Tauri API type definitions
 * These extend the window object with Tauri globals
 */

declare global {
  interface Window {
    __TAURI__?: {
      invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
    };
  }
}

export {};
