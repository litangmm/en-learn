import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Audio to prevent tests from playing sounds
Object.defineProperty(globalThis, 'Audio', {
  writable: true,
  configurable: true,
  value: vi.fn(() => ({
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    currentTime: 0,
    volume: 1,
    muted: false,
    src: '',
    load: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock speechSynthesis to prevent tests from attempting TTS
// Use writable/configurable so individual tests can override with vi.stubGlobal
Object.defineProperty(globalThis, 'speechSynthesis', {
  writable: true,
  configurable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
    onvoiceschanged: null,
    paused: false,
    pending: false,
    speaking: false,
  },
});

Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
  writable: true,
  configurable: true,
  value: function (this: unknown, text: string) {
    return {
      text,
      lang: 'en-US',
      rate: 1,
      pitch: 1,
      voice: null,
      onstart: null,
      onend: null,
      onerror: null,
    };
  },
});

// Mock window.matchMedia for responsive testing
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo for Radix UI Select components
Object.defineProperty(globalThis, 'scrollTo', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

// Mock scrollIntoView for Radix UI Select components
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      // Support throwing for specific test keys (for quota exceeded testing)
      if (key === 'throw-error') {
        throw new Error('QuotaExceededError');
      }
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  };
})();

// Track when setItem should throw (for quota exceeded tests)
let setItemShouldThrow = false;
let throwOnNextSetItem = false;

const localStorageForStorage = {
  getItem: vi.fn((key: string) => localStorageMock.getItem(key)),
  setItem: vi.fn((key: string, value: string) => {
    if (setItemShouldThrow || throwOnNextSetItem) {
      throwOnNextSetItem = false;
      throw new Error('QuotaExceededError');
    }
    localStorageMock.setItem(key, value);
  }),
  removeItem: vi.fn((key: string) => localStorageMock.removeItem(key)),
  clear: vi.fn(() => localStorageMock.clear()),
  get length() { return Object.keys({}).length; },
  key: vi.fn(() => null),
};

// Export for tests to control behavior
export const __mockLocalStorage__ = {
  get mock() { return localStorageMock; },
  get storage() { return localStorageForStorage; },
  setThrowOnNextSetItem(value: boolean) { throwOnNextSetItem = value; },
  setShouldThrow(value: boolean) { setItemShouldThrow = value; },
  reset() {
    setItemShouldThrow = false;
    throwOnNextSetItem = false;
  }
};

Object.defineProperty(globalThis, 'localStorage', {
  writable: true,
  configurable: true,
  value: localStorageForStorage,
});
