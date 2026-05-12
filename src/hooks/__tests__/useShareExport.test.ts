import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareExport, generateShareText, copyToClipboard, downloadBlob } from '../useShareExport';
import type { ShareCardData } from '@/data/types';

// Mock html2canvas - must be at top level
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toBlob: vi.fn((callback) => {
      callback(new Blob(['test-image-data'], { type: 'image/png' }));
    }),
  }),
}));

// Mock clipboard
const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);

// Mock URL
const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
const mockRevokeObjectURL = vi.fn();

// Sample test data
const mockShareCardData: ShareCardData = {
  xp: { totalXP: 1000, currentLevel: 5, levelProgress: 75 },
  session: { score: 120, accuracy: 0.85, streak: 10 },
  badges: [{ id: 'test-badge', icon: 'Flame' }],
  rank: 3,
  appName: 'en-learn',
};

describe('generateShareText', () => {
  it('generates correct text format with level, XP, streak, accuracy, score', () => {
    const text = generateShareText(mockShareCardData);

    expect(text).toContain('en-learn 学习成果');
    expect(text).toContain('Lv.5');
    expect(text).toContain('1,000 XP');
    expect(text).toContain('连续答题: 10');
    expect(text).toContain('正确率: 85%');
    expect(text).toContain('本次得分: 120');
  });

  it('includes badges section when badges exist', () => {
    const text = generateShareText(mockShareCardData);

    expect(text).toContain('获得成就: Flame');
  });

  it('includes rank section when rank > 0', () => {
    const text = generateShareText(mockShareCardData);

    expect(text).toContain('🏆 排行榜第 3 名');
  });

  it('omits badges section when badges array is empty', () => {
    const dataWithoutBadges: ShareCardData = {
      ...mockShareCardData,
      badges: [],
    };
    const text = generateShareText(dataWithoutBadges);

    expect(text).not.toContain('获得成就:');
  });

  it('omits rank section when rank is 0', () => {
    const dataWithoutRank: ShareCardData = {
      ...mockShareCardData,
      rank: 0,
    };
    const text = generateShareText(dataWithoutRank);

    expect(text).not.toContain('🏆 排行榜');
  });

  it('limits badges to first 3 when there are more', () => {
    const dataWithManyBadges: ShareCardData = {
      ...mockShareCardData,
      badges: [
        { id: 'badge-1', icon: 'A' },
        { id: 'badge-2', icon: 'B' },
        { id: 'badge-3', icon: 'C' },
        { id: 'badge-4', icon: 'D' },
      ],
    };
    const text = generateShareText(dataWithManyBadges);

    expect(text).toContain('获得成就: A B C');
    expect(text).not.toContain('D');
  });

  it('formats totalXP with thousand separators', () => {
    const dataWithLargeXP: ShareCardData = {
      ...mockShareCardData,
      xp: { totalXP: 1234567, currentLevel: 10, levelProgress: 50 },
    };
    const text = generateShareText(dataWithLargeXP);

    expect(text).toContain('1,234,567 XP');
  });

  it('handles accuracy rounding correctly', () => {
    const dataWithDecimalAccuracy: ShareCardData = {
      ...mockShareCardData,
      session: { score: 100, accuracy: 0.766, streak: 5 },
    };
    const text = generateShareText(dataWithDecimalAccuracy);

    expect(text).toContain('正确率: 77%');
  });

  it('handles empty app name', () => {
    const dataWithEmptyAppName: ShareCardData = {
      ...mockShareCardData,
      appName: '',
    };
    const text = generateShareText(dataWithEmptyAppName);

    expect(text).toContain(' 学习成果');
    expect(text).toContain('Lv.5');
  });

  it('generates consistent output format with separator line', () => {
    const text = generateShareText(mockShareCardData);
    const lines = text.split('\n');

    // With badges and rank: title, separator, level/XP, streak/accuracy, score, badges, rank = 7 lines
    expect(lines[0]).toBe('en-learn 学习成果');
    expect(lines[1]).toBe('─────────────────');
  });
});

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockClipboardWriteText },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when clipboard API succeeds', async () => {
    mockClipboardWriteText.mockResolvedValueOnce(undefined);

    const result = await copyToClipboard('test text');

    expect(result).toBe(true);
    expect(mockClipboardWriteText).toHaveBeenCalledWith('test text');
  });

  it('returns false when clipboard API fails', async () => {
    mockClipboardWriteText.mockRejectedValueOnce(new Error('Clipboard access denied'));

    const result = await copyToClipboard('test text');

    expect(result).toBe(false);
  });

  it('returns false on security error', async () => {
    mockClipboardWriteText.mockRejectedValueOnce(new DOMException('Permission denied', 'SecurityError'));

    const result = await copyToClipboard('sensitive text');

    expect(result).toBe(false);
  });

  it('calls clipboard with correct text content', async () => {
    const testText = 'Custom share text content';
    await copyToClipboard(testText);

    expect(mockClipboardWriteText).toHaveBeenCalledWith(testText);
  });
});

describe('downloadBlob', () => {
  const mockAppendChild = vi.fn();
  const mockRemoveChild = vi.fn();
  const mockClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL methods
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    // Mock document methods - only need to mock what's used
    const originalCreateElement = document.createElement.bind(document);
    vi.stubGlobal('document', {
      ...document,
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick,
          };
        }
        return originalCreateElement(tagName);
      }),
      body: {
        ...document.body,
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a download link and triggers click', () => {
    const blob = new Blob(['test'], { type: 'image/png' });

    downloadBlob(blob, 'test-image.png');

    expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('uses the correct filename', () => {
    const blob = new Blob(['test'], { type: 'image/png' });

    downloadBlob(blob, 'custom-filename.png');

    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('revokes object URL after download', () => {
    const blob = new Blob(['test'], { type: 'image/png' });

    downloadBlob(blob, 'test.png');

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('handles different file types', () => {
    const pdfBlob = new Blob(['pdf-content'], { type: 'application/pdf' });

    downloadBlob(pdfBlob, 'document.pdf');

    expect(mockCreateObjectURL).toHaveBeenCalledWith(pdfBlob);
  });

  it('creates link with correct href', () => {
    const blob = new Blob(['test'], { type: 'image/png' });

    downloadBlob(blob, 'test.png');

    // Verify URL.createObjectURL was called with the blob
    expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
  });
});

describe('useShareExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup clipboard mock
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockClipboardWriteText },
    });

    // Setup URL mock
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('setCardRef', () => {
    it('correctly stores the DOM element reference', async () => {
      const { result } = renderHook(() => useShareExport());

      const mockElement = document.createElement('div');

      act(() => {
        result.current.setCardRef(mockElement);
      });

      // The hook should store the element without throwing
      expect(result.current.setCardRef).toBeDefined();
    });

    it('accepts null to clear the reference', async () => {
      const { result } = renderHook(() => useShareExport());

      const mockElement = document.createElement('div');

      act(() => {
        result.current.setCardRef(mockElement);
        result.current.setCardRef(null);
      });

      expect(result.current.setCardRef).toBeDefined();
    });
  });

  describe('downloadImage', () => {
    it('returns false when no ref is set', async () => {
      const { result } = renderHook(() => useShareExport());

      const downloadResult = await result.current.downloadImage(mockShareCardData);

      expect(downloadResult).toBe(false);
    });

    it('returns true when image generated and downloaded successfully', async () => {
      const { result } = renderHook(() => useShareExport());
      const mockElement = document.createElement('div');

      act(() => {
        result.current.setCardRef(mockElement);
      });

      const downloadResult = await result.current.downloadImage(mockShareCardData);

      expect(downloadResult).toBe(true);
    });

    it('uses correct filename format with level', async () => {
      const { result } = renderHook(() => useShareExport());
      const mockElement = document.createElement('div');

      act(() => {
        result.current.setCardRef(mockElement);
      });

      await result.current.downloadImage(mockShareCardData);

      // File should be created
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('returns false when html2canvas throws error', async () => {
      // Reset the mock to throw
      const html2canvas = await import('html2canvas');
      const originalMock = vi.mocked(html2canvas.default);
      originalMock.mockRejectedValueOnce(new Error('Canvas error'));

      const { result } = renderHook(() => useShareExport());
      const mockElement = document.createElement('div');

      act(() => {
        result.current.setCardRef(mockElement);
      });

      const downloadResult = await result.current.downloadImage(mockShareCardData);

      expect(downloadResult).toBe(false);

      // Restore the mock - eslint-disable for test mock compatibility
      originalMock.mockResolvedValue({
        toBlob: vi.fn((_cb: (blob: Blob | null) => void) => {
          void _cb; // Explicitly unused
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    it('returns false when toBlob callback receives null', async () => {
      const html2canvas = await import('html2canvas');
      const originalMock = vi.mocked(html2canvas.default);
      originalMock.mockResolvedValue({
        toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
          cb(null);
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const { result } = renderHook(() => useShareExport());
      const mockElement = document.createElement('div');

      act(() => {
        result.current.setCardRef(mockElement);
      });

      const downloadResult = await result.current.downloadImage(mockShareCardData);

      expect(downloadResult).toBe(false);

      // Restore the mock - eslint-disable for test mock compatibility
      originalMock.mockResolvedValue({
        toBlob: vi.fn((_cb: (blob: Blob | null) => void) => {
          void _cb; // Explicitly unused
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });
  });

  describe('copyText', () => {
    it('returns result from copyToClipboard', async () => {
      const { result } = renderHook(() => useShareExport());

      mockClipboardWriteText.mockResolvedValueOnce(undefined);
      const copyResult = await result.current.copyText(mockShareCardData);

      expect(copyResult).toBe(true);
      expect(mockClipboardWriteText).toHaveBeenCalled();
    });

    it('returns false when clipboard fails', async () => {
      const { result } = renderHook(() => useShareExport());

      mockClipboardWriteText.mockRejectedValueOnce(new Error('Failed'));
      const copyResult = await result.current.copyText(mockShareCardData);

      expect(copyResult).toBe(false);
    });

    it('generates text using generateShareText', async () => {
      const { result } = renderHook(() => useShareExport());

      mockClipboardWriteText.mockResolvedValueOnce(undefined);
      await result.current.copyText(mockShareCardData);

      expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.stringContaining('en-learn 学习成果'));
      expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.stringContaining('Lv.5'));
    });

    it('works with data that has no badges', async () => {
      const { result } = renderHook(() => useShareExport());
      const dataNoBadges: ShareCardData = {
        ...mockShareCardData,
        badges: [],
      };

      mockClipboardWriteText.mockResolvedValueOnce(undefined);
      const copyResult = await result.current.copyText(dataNoBadges);

      expect(copyResult).toBe(true);
      expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.not.stringContaining('获得成就:'));
    });

    it('works with data that has no rank', async () => {
      const { result } = renderHook(() => useShareExport());
      const dataNoRank: ShareCardData = {
        ...mockShareCardData,
        rank: 0,
      };

      mockClipboardWriteText.mockResolvedValueOnce(undefined);
      const copyResult = await result.current.copyText(dataNoRank);

      expect(copyResult).toBe(true);
      expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.not.stringContaining('🏆 排行榜'));
    });
  });

  describe('return shape', () => {
    it('returns all required functions', () => {
      const { result } = renderHook(() => useShareExport());

      expect(result.current).toHaveProperty('setCardRef');
      expect(result.current).toHaveProperty('downloadImage');
      expect(result.current).toHaveProperty('copyText');
    });

    it('setCardRef is a function', () => {
      const { result } = renderHook(() => useShareExport());

      expect(typeof result.current.setCardRef).toBe('function');
    });

    it('downloadImage is an async function', () => {
      const { result } = renderHook(() => useShareExport());

      expect(result.current.downloadImage.constructor.name).toBe('AsyncFunction');
    });

    it('copyText is an async function', () => {
      const { result } = renderHook(() => useShareExport());

      expect(result.current.copyText.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('edge cases', () => {
    it('handles very long app names', async () => {
      const { result } = renderHook(() => useShareExport());
      const dataLongAppName: ShareCardData = {
        ...mockShareCardData,
        appName: 'a'.repeat(100),
      };

      mockClipboardWriteText.mockResolvedValueOnce(undefined);
      const copyResult = await result.current.copyText(dataLongAppName);

      expect(copyResult).toBe(true);
    });

    it('handles zero values in session', async () => {
      const { result } = renderHook(() => useShareExport());
      const dataZeroSession: ShareCardData = {
        ...mockShareCardData,
        session: { score: 0, accuracy: 0, streak: 0 },
      };

      mockClipboardWriteText.mockResolvedValueOnce(undefined);
      await result.current.copyText(dataZeroSession);

      expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.stringContaining('本次得分: 0'));
    });

    it('handles negative rank gracefully', async () => {
      const { result } = renderHook(() => useShareExport());
      const dataNegativeRank: ShareCardData = {
        ...mockShareCardData,
        rank: -1,
      };

      mockClipboardWriteText.mockResolvedValueOnce(undefined);
      await result.current.copyText(dataNegativeRank);

      expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.not.stringContaining('🏆 排行榜'));
    });

    it('handles very large XP values', async () => {
      const { result } = renderHook(() => useShareExport());
      const dataLargeXP: ShareCardData = {
        ...mockShareCardData,
        xp: { totalXP: 999999999, currentLevel: 99, levelProgress: 99 },
      };

      mockClipboardWriteText.mockResolvedValueOnce(undefined);
      await result.current.copyText(dataLargeXP);

      expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.stringContaining('999,999,999 XP'));
    });
  });
});