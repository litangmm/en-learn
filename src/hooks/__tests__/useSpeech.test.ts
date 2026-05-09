import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeech } from '../useSpeech';

const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockGetVoices = vi.fn(() => [
  { lang: 'en-US', name: 'Google US English' },
  { lang: 'en-GB', name: 'Daniel' },
  { lang: 'zh-CN', name: 'Chinese' },
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

describe('useSpeech', () => {
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

  it('should initialize with isSpeaking as false', () => {
    const { result } = renderHook(() => useSpeech());
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should call speechSynthesis.speak when speak is invoked', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak('Hello world');
    });

    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalledOnce();
    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe('Hello world');
    expect(utterance.lang).toBe('en-US');
    expect(utterance.rate).toBe(1.0);
    expect(utterance.pitch).toBe(1);
  });

  it('should accept custom rate', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak('Test', 0.5);
    });

    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.rate).toBe(0.5);
  });

  it('should select an English voice', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak('Hello');
    });

    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.voice).not.toBeNull();
    expect(utterance.voice?.lang.startsWith('en')).toBe(true);
  });

  it('should set isSpeaking to true on start and false on end', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak('Hello');
    });

    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(result.current.isSpeaking).toBe(false);

    act(() => {
      utterance.onstart?.();
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      utterance.onend?.();
    });
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should set isSpeaking to false on error', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak('Hello');
    });

    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;

    act(() => {
      utterance.onstart?.();
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      utterance.onerror?.();
    });
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should call cancel and set isSpeaking to false when stop is invoked', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak('Hello');
    });

    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    act(() => {
      utterance.onstart?.();
    });

    act(() => {
      result.current.stop();
    });

    expect(mockCancel).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('should warn and do nothing if speechSynthesis is not supported', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('speechSynthesis', undefined);

    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak('Hello');
    });

    expect(mockSpeak).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Speech synthesis not supported');

    consoleSpy.mockRestore();
  });
});
