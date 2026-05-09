import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeech } from '../useSpeech';

const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockGetVoices = vi.fn(() => [
  { lang: 'en-US', name: 'Google US English' },
]);

class MockSpeechSynthesisUtterance {
  text = '';
  lang = '';
  rate = 1;
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe('useSpeech rate', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', {
      speak: mockSpeak,
      cancel: mockCancel,
      getVoices: mockGetVoices,
    });
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);
    mockSpeak.mockClear();
    mockCancel.mockClear();
  });

  it('has default playbackRate of 1.0', () => {
    const { result } = renderHook(() => useSpeech());
    expect(result.current.playbackRate).toBe(1.0);
  });

  it('updates playbackRate via setPlaybackRate', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.setPlaybackRate(0.75);
    });

    expect(result.current.playbackRate).toBe(0.75);
  });

  it('uses playbackRate when speak() is called without rate argument', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.setPlaybackRate(1.25);
    });

    act(() => {
      result.current.speak('Hello world');
    });

    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.rate).toBe(1.25);
  });

  it('overrides playbackRate when speak() is called with rate argument', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.setPlaybackRate(1.25);
    });

    act(() => {
      result.current.speak('Hello world', 0.5);
    });

    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.rate).toBe(0.5);
  });

  it('uses default playbackRate of 1.0 when setPlaybackRate has not been called', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak('Hello world');
    });

    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.rate).toBe(1.0);
  });
});
