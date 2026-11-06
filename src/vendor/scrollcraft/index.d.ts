// Types for the vendored scroll-craft engine (MIT, Nate Herk). The engine itself is copied
// unchanged from github.com/nateherkai/scroll-craft; theme it from the page, never edit it.
export interface ScrollCraftInstance {
  layout(): void;
  read(): void;
  destroy(): void;
}
declare global {
  interface Window {
    ScrollCraft?: {
      mount(root: Element, opts?: Record<string, unknown>): ScrollCraftInstance;
      reduce: boolean;
    };
  }
}
