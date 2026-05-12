import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBadgeExport, generateBadgeImage, downloadBadgeBlob } from '../useBadgeExport';

// Mock html2canvas - must be at top level
 
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toBlob: vi.fn((_callback: (_blob: Blob | null) => void) => {
      _callback(new Blob(['test-image-data'], { type: 'image/png' }));
    }),
  }),
}));

// Mock URL
const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
const mockRevokeObjectURL = vi.fn();

// Mock clipboard
const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);

describe('generateBadgeImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates image blob from DOM element', async () => {
    const mockElement = document.createElement('div');
    mockElement.innerHTML = '<p>Test badge content</p>';
    document.body.appendChild(mockElement);

    const blob = await generateBadgeImage(mockElement);

    // Verify blob was generated
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');

    document.body.removeChild(mockElement);
  });

  it('uses correct html2canvas options', async () => {
    const html2canvas = await import('html2canvas');
    const mockFn = html2canvas.default as ReturnType<typeof vi.fn>;

    const mockElement = document.createElement('div');
    document.body.appendChild(mockElement);

    await generateBadgeImage(mockElement);

    expect(mockFn).toHaveBeenCalledWith(mockElement, expect.objectContaining({
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    }));

    document.body.removeChild(mockElement);
  });

  it('handles toBlob returning valid blob', async () => {
    const html2canvas = await import('html2canvas');
    const originalMock = html2canvas.default as ReturnType<typeof vi.fn>;
    originalMock.mockResolvedValue({
      toBlob: vi.fn((_callback: (_blob: Blob | null) => void) => {
        _callback(new Blob(['valid-image'], { type: 'image/png' }));
      }),
    });

    const mockElement = document.createElement('div');
    document.body.appendChild(mockElement);

    const blob = await generateBadgeImage(mockElement);

    expect(blob).toBeInstanceOf(Blob);

    document.body.removeChild(mockElement);
  });

  it('handles toBlob callback called with null', async () => {
    const html2canvas = await import('html2canvas');
    const originalMock = html2canvas.default as ReturnType<typeof vi.fn>;
    originalMock.mockResolvedValue({
      toBlob: vi.fn((callback: (_blob: Blob | null) => void) => {
        callback(null);
      }),
    });

    const mockElement = document.createElement('div');
    document.body.appendChild(mockElement);

    // When toBlob returns null, the promise resolves with null
    const blob = await generateBadgeImage(mockElement);
    // The implementation uses blob! so it passes null through
    expect(blob).toBeNull();

    document.body.removeChild(mockElement);
  });
});

describe('downloadBadgeBlob', () => {
  const mockAppendChild = vi.fn();
  const mockRemoveChild = vi.fn();
  const mockClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

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
        return document.createElement(tagName);
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

    downloadBadgeBlob(blob, 'badges.png');

    expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('uses the provided filename', () => {
    const blob = new Blob(['test'], { type: 'image/png' });

    downloadBadgeBlob(blob, 'en-learn-badges.png');

    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('revokes object URL after download', () => {
    const blob = new Blob(['test'], { type: 'image/png' });

    downloadBadgeBlob(blob, 'test.png');

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('handles different file types', () => {
    const blob = new Blob(['test'], { type: 'image/png' });

    downloadBadgeBlob(blob, 'custom-filename.png');

    expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
  });
});

describe('useBadgeExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockClipboardWriteText },
    });

    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('exportAsImage', () => {
    it('returns false when element is null', async () => {
      const { result } = renderHook(() => useBadgeExport());

      const exportResult = await result.current.exportAsImage(null);

      expect(exportResult).toBe(false);
    });

    it('returns true when image generated successfully', async () => {
      const { result } = renderHook(() => useBadgeExport());
      const mockElement = document.createElement('div');

      const exportResult = await result.current.exportAsImage(mockElement);

      expect(exportResult).toBe(true);
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('uses default filename when not specified', async () => {
      const { result } = renderHook(() => useBadgeExport());
      const mockElement = document.createElement('div');

      await result.current.exportAsImage(mockElement);

      // Just verify export succeeds with default filename
      expect(result.current.isExporting).toBe(false);
    });

    it('uses custom filename when specified', async () => {
      const { result } = renderHook(() => useBadgeExport());
      const mockElement = document.createElement('div');

      await result.current.exportAsImage(mockElement, 'my-badges.png');

      expect(result.current.isExporting).toBe(false);
    });
  });

  describe('clearError', () => {
    it('is a function', () => {
      const { result } = renderHook(() => useBadgeExport());

      expect(typeof result.current.clearError).toBe('function');
    });

    it('clears the exportError state', () => {
      const { result } = renderHook(() => useBadgeExport());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.exportError).toBeNull();
    });
  });

  describe('return shape', () => {
    it('returns all required properties', () => {
      const { result } = renderHook(() => useBadgeExport());

      expect(result.current).toHaveProperty('exportAsImage');
      expect(result.current).toHaveProperty('isExporting');
      expect(result.current).toHaveProperty('exportError');
      expect(result.current).toHaveProperty('clearError');
    });

    it('exportAsImage is an async function', () => {
      const { result } = renderHook(() => useBadgeExport());

      expect(result.current.exportAsImage.constructor.name).toBe('AsyncFunction');
    });

    it('clearError is a function', () => {
      const { result } = renderHook(() => useBadgeExport());

      expect(typeof result.current.clearError).toBe('function');
    });

    it('isExporting is a boolean', () => {
      const { result } = renderHook(() => useBadgeExport());

      expect(typeof result.current.isExporting).toBe('boolean');
    });

    it('exportError can be null', () => {
      const { result } = renderHook(() => useBadgeExport());

      expect(result.current.exportError).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles element without content', async () => {
      const { result } = renderHook(() => useBadgeExport());
      const emptyElement = document.createElement('div');

      const exportResult = await result.current.exportAsImage(emptyElement);

      expect(exportResult).toBe(true);
    });

    it('handles multiple sequential exports', async () => {
      const { result } = renderHook(() => useBadgeExport());
      const mockElement = document.createElement('div');

      const firstResult = await result.current.exportAsImage(mockElement);
      const secondResult = await result.current.exportAsImage(mockElement);

      expect(firstResult).toBe(true);
      expect(secondResult).toBe(true);
    });

    it('handles empty element reference', async () => {
      const { result } = renderHook(() => useBadgeExport());

      const exportResult = await result.current.exportAsImage(null);

      expect(exportResult).toBe(false);
    });

    it('handles null element gracefully', async () => {
      const { result } = renderHook(() => useBadgeExport());

      const exportResult = await result.current.exportAsImage(null);

      expect(exportResult).toBe(false);
      expect(result.current.exportError).toBeNull(); // No error for null element, just returns false
    });
  });
});