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
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
