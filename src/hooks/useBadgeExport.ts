import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';

/**
 * Generate PNG blob from a DOM element using html2canvas
 */
export async function generateBadgeImage(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2, // High DPI for better quality
    useCORS: true,
    logging: false,
  });
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/**
 * Download blob as file
 */
export function downloadBadgeBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Hook for exporting badge wall as image.
 * Provides functionality to:
 * - Export a DOM element as PNG image
 * - Track export loading state
 */
export function useBadgeExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportAsImage = useCallback(
    async (element: HTMLElement | null, filename = 'en-learn-badges.png'): Promise<boolean> => {
      if (!element) {
        setExportError('Badge wall element not found');
        return false;
      }

      setIsExporting(true);
      setExportError(null);

      try {
        const blob = await generateBadgeImage(element);
        downloadBadgeBlob(blob, filename);
        return true;
      } catch (error) {
        console.error('Failed to export badge wall:', error);
        setExportError('Failed to generate image');
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setExportError(null);
  }, []);

  return {
    exportAsImage,
    isExporting,
    exportError,
    clearError,
  };
}