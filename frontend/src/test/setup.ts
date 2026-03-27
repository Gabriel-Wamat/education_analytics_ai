import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

if (typeof window !== "undefined") {
  vi.stubGlobal("Request", window.Request);
  vi.stubGlobal("Response", window.Response);
  vi.stubGlobal("Headers", window.Headers);
  vi.stubGlobal("AbortController", window.AbortController);
  vi.stubGlobal("AbortSignal", window.AbortSignal);
}
