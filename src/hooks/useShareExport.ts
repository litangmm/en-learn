import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import type { ShareCardData } from '@/data/types';

/**
 * Format badge section of share text
 */
function formatBadgesSection(badges: Array<{ id: string; icon: string }>): string {
  if (badges.length === 0) return '';
  const icons = badges.slice(0, 3).map((b) => b.icon).join(' ');
  return `\n获得成就: ${icons}`;
}

/**
 * Format rank section of share text
 */
function formatRankSection(rank: number): string {
  if (rank <= 0) return '';
  return `\n🏆 排行榜第 ${rank} 名`;
}

/**
 * Generate formatted text share content from ShareCardData
 * Format: Level, XP, streak, accuracy, score, rank
 */
export function generateShareText(data: ShareCardData): string {
  const { xp, session, badges, rank, appName } = data;

  let text = `${appName} 学习成果\n`;
  text += `─────────────────\n`;
  text += `Lv.${xp.currentLevel} | ${xp.totalXP.toLocaleString()} XP\n`;
  text += `连续答题: ${session.streak} | 正确率: ${Math.round(session.accuracy * 100)}%\n`;
  text += `本次得分: ${session.score}`;

  // Add badges section if any
  const badgesSection = formatBadgesSection(badges);
  if (badgesSection) {
    text += badgesSection;
  }

  // Add rank section if any
  const rankSection = formatRankSection(rank);
  if (rankSection) {
    text += rankSection;
  }

  return text;
}

/**
 * Generate share image from DOM element using html2canvas
 */
export async function generateShareImage(element: HTMLElement): Promise<Blob> {
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
export function downloadBlob(blob: Blob, filename: string): void {
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
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook for sharing/exporting share card content
 *
 * Provides functionality to:
 * - Set ref to share card DOM element for image generation
 * - Download share card as PNG image
 * - Copy share card data as formatted text
 */
export function useShareExport() {
  const cardRef = useRef<HTMLElement | null>(null);

  const setCardRef = useCallback((element: HTMLElement | null) => {
    cardRef.current = element;
  }, []);

  const generateImage = useCallback(
    async (): Promise<Blob | null> => {
      if (!cardRef.current) return null;
      try {
        const blob = await generateShareImage(cardRef.current);
        return blob;
      } catch (error) {
        console.error('Failed to generate image:', error);
        return null;
      }
    },
    []
  );

  const downloadImage = useCallback(
    async (data: ShareCardData): Promise<boolean> => {
      const blob = await generateImage();
      if (!blob) return false;
      downloadBlob(blob, `en-learn-${data.xp.currentLevel}lv.png`);
      return true;
    },
    [generateImage]
  );

  const copyText = useCallback(async (data: ShareCardData): Promise<boolean> => {
    const text = generateShareText(data);
    return copyToClipboard(text);
  }, []);

  return {
    setCardRef,
    downloadImage,
    copyText,
  };
}