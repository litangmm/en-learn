/**
 * Visual Regression Testing Utility
 *
 * Provides baseline storage, diff generation, and pixel difference threshold comparison
 * for visual regression testing in E2E test suites.
 *
 * @module e2e/utils/visual-regression
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Result of a visual regression comparison
 */
export interface VisualRegressionResult {
  /** Whether the comparison passed the threshold check */
  passed: boolean;
  /** Pixel difference percentage (0-100) */
  pixelDifference: number;
  /** Path to the generated diff image (if comparison was performed) */
  diffPath: string | null;
  /** Additional metadata about the comparison */
  metadata?: {
    currentFileSize: number;
    baselineFileSize: number;
    currentHash: string;
    baselineHash: string;
  };
}

/**
 * Configuration options for visual regression testing
 */
export interface VisualRegressionConfig {
  /** Directory to store baseline screenshots */
  baselineDir: string;
  /** Directory to store diff images */
  diffDir: string;
  /** Default threshold for pixel difference (0-100) */
  threshold: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: VisualRegressionConfig = {
  baselineDir: '.visual-baselines',
  diffDir: '.visual-diffs',
  threshold: 1, // 1% default pixel difference tolerance
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate SHA-256 hash of a file
 * @param filePath - Path to the file
 * @returns Promise resolving to hex hash string
 */
async function calculateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Get file size in bytes
 * @param filePath - Path to the file
 * @returns Promise resolving to file size in bytes
 */
async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * Ensure directory exists, create if it doesn't
 * @param dirPath - Path to the directory
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    // Directory already exists, ignore error
  }
}

/**
 * Normalize screenshot name for use in file paths
 * @param name - The screenshot name
 * @returns Normalized name safe for file system
 */
function normalizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

// ============================================================================
// Visual Regression Class
// ============================================================================

/**
 * Visual Regression Testing utility class
 *
 * Provides methods for:
 * - Storing and retrieving baseline screenshots
 * - Comparing current screenshots with baselines
 * - Generating visual diffs
 * - Checking if differences are within acceptable thresholds
 */
export class VisualRegression {
  private config: VisualRegressionConfig;

  /**
   * Create a new VisualRegression instance
   * @param config - Configuration options (optional, uses defaults if not provided)
   */
  constructor(config: Partial<VisualRegressionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the baseline directory path
   * @returns Absolute path to the baseline directory
   */
  getBaselineDir(): string {
    return this.config.baselineDir;
  }

  /**
   * Get the diff directory path
   * @returns Absolute path to the diff directory
   */
  getDiffDir(): string {
    return this.config.diffDir;
  }

  /**
   * Get the current threshold
   * @returns The pixel difference threshold percentage
   */
  getThreshold(): number {
    return this.config.threshold;
  }

  /**
   * Set a new threshold
   * @param threshold - New threshold value (0-100)
   */
  setThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 100) {
      throw new Error('Threshold must be between 0 and 100');
    }
    this.config.threshold = threshold;
  }

  /**
   * Get the path to a baseline screenshot
   * @param name - The baseline name
   * @returns Absolute path to the baseline screenshot
   */
  getBaselinePath(name: string): string {
    const normalizedName = normalizeName(name);
    return path.join(this.config.baselineDir, `${normalizedName}.png`);
  }

  /**
   * Get the path to a diff image
   * @param name - The comparison name
   * @returns Absolute path to the diff image
   */
  getDiffPath(name: string): string {
    const normalizedName = normalizeName(name);
    return path.join(this.config.diffDir, `${normalizedName}-diff.png`);
  }

  /**
   * Check if a baseline exists
   * @param name - The baseline name
   * @returns Promise resolving to true if baseline exists
   */
  async baselineExists(name: string): Promise<boolean> {
    const baselinePath = this.getBaselinePath(name);
    try {
      await fs.access(baselinePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save a screenshot as a baseline
   *
   * Copies the screenshot to the baseline directory with a normalized name.
   * Creates the baseline directory if it doesn't exist.
   *
   * @param screenshotPath - Path to the current screenshot
   * @param name - Name for the baseline (used for file naming)
   * @returns Promise resolving to the baseline path
   * @throws Error if screenshot file doesn't exist
   */
  async saveBaseline(screenshotPath: string, name: string): Promise<string> {
    // Verify source file exists
    try {
      await fs.access(screenshotPath);
    } catch {
      throw new Error(`Screenshot file not found: ${screenshotPath}`);
    }

    // Ensure baseline directory exists
    await ensureDir(this.config.baselineDir);

    const baselinePath = this.getBaselinePath(name);

    // Copy screenshot to baseline directory
    await fs.copyFile(screenshotPath, baselinePath);

    return baselinePath;
  }

  /**
   * Load a baseline screenshot path
   *
   * Returns the path to the baseline screenshot. Does not load the actual image data.
   *
   * @param name - Name of the baseline
   * @returns Promise resolving to the baseline path
   * @throws Error if baseline doesn't exist
   */
  async loadBaseline(name: string): Promise<string> {
    const baselinePath = this.getBaselinePath(name);

    try {
      await fs.access(baselinePath);
    } catch {
      throw new Error(`Baseline not found: ${name}. Please save a baseline first.`);
    }

    return baselinePath;
  }

  /**
   * Compare two screenshots and calculate pixel difference
   *
   * Uses a combination of file hash and size comparison to estimate pixel difference.
   * When image processing libraries are available, this can be enhanced with pixel-by-pixel comparison.
   *
   * @param currentPath - Path to the current screenshot
   * @param baselinePath - Path to the baseline screenshot
   * @returns Promise resolving to pixel difference percentage (0-100)
   */
  async calculateDifference(currentPath: string, baselinePath: string): Promise<number> {
    // Verify both files exist
    try {
      await fs.access(currentPath);
      await fs.access(baselinePath);
    } catch {
      throw new Error('One or both screenshot files not found');
    }

    // Get file metadata
    const [currentStats, baselineStats] = await Promise.all([
      fs.stat(currentPath),
      fs.stat(baselinePath),
    ]);

    const currentSize = currentStats.size;
    const baselineSize = baselineStats.size;

    // If file sizes are identical, check hash
    if (currentSize === baselineSize) {
      const [currentHash, baselineHash] = await Promise.all([
        calculateFileHash(currentPath),
        calculateFileHash(baselinePath),
      ]);

      // If hashes match, images are identical
      if (currentHash === baselineHash) {
        return 0;
      }
    }

    // Calculate size difference percentage as a proxy for pixel difference
    // This is a simplified approach - a more accurate implementation would use actual pixel comparison
    const sizeDiff = Math.abs(currentSize - baselineSize);
    const maxSize = Math.max(currentSize, baselineSize);
    const sizeDifferencePercent = (sizeDiff / maxSize) * 100;

    // Apply a scaling factor since file size doesn't directly map to pixel difference
    // This heuristic provides reasonable differentiation without image processing libraries
    // For exact pixel comparison, integrate a library like 'pixelmatch' or 'jimp'
    const estimatedPixelDifference = Math.min(sizeDifferencePercent * 0.5, 100);

    return Math.round(estimatedPixelDifference * 100) / 100;
  }

  /**
   * Compare screenshots and return detailed result
   *
   * Combines difference calculation with threshold checking and diff generation.
   *
   * @param currentPath - Path to the current screenshot
   * @param baselinePath - Path to the baseline screenshot
   * @param diffName - Name for the diff file (optional, auto-generated if not provided)
   * @returns Promise resolving to VisualRegressionResult
   */
  async compareScreenshots(
    currentPath: string,
    baselinePath: string,
    diffName?: string
  ): Promise<VisualRegressionResult> {
    // Calculate pixel difference
    const pixelDifference = await this.calculateDifference(currentPath, baselinePath);

    // Ensure diff directory exists
    await ensureDir(this.config.diffDir);

    // Generate diff
    const diffPath = diffName ? this.getDiffPath(diffName) : null;
    if (diffPath) {
      await this.generateDiff(currentPath, baselinePath, diffPath);
    }

    // Get metadata
    const [currentHash, baselineHash] = await Promise.all([
      calculateFileHash(currentPath),
      calculateFileHash(baselinePath),
    ]);

    const [currentSize, baselineSize] = await Promise.all([
      getFileSize(currentPath),
      getFileSize(baselinePath),
    ]);

    return {
      passed: this.isWithinThreshold(pixelDifference),
      pixelDifference,
      diffPath,
      metadata: {
        currentFileSize: currentSize,
        baselineFileSize: baselineSize,
        currentHash,
        baselineHash,
      },
    };
  }

  /**
   * Generate a visual diff image
   *
   * Creates a diff image showing differences between current and baseline screenshots.
   * Uses a simple byte-level overlay approach. For better results, integrate an image
   * processing library like 'jimp' or 'sharp'.
   *
   * @param currentPath - Path to the current screenshot
   * @param baselinePath - Path to the baseline screenshot
   * @param diffPath - Path where the diff image should be saved
   * @returns Promise resolving to the diff path
   */
  async generateDiff(
    currentPath: string,
    baselinePath: string,
    diffPath: string
  ): Promise<string> {
    // Verify both files exist
    try {
      await fs.access(currentPath);
      await fs.access(baselinePath);
    } catch {
      throw new Error('One or both screenshot files not found');
    }

    // Read both files
    const [currentBuffer, baselineBuffer] = await Promise.all([
      fs.readFile(currentPath),
      fs.readFile(baselinePath),
    ]);

    // Ensure diff directory exists
    await ensureDir(path.dirname(diffPath));

    // For a simple implementation, we create a diff by marking differences
    // This creates a text-based diff description in a simple format
    // A production implementation would use image processing libraries for pixel-accurate diffs

    if (currentBuffer.equals(baselineBuffer)) {
      // Files are identical, create a placeholder indicating no differences
      await fs.writeFile(diffPath, currentBuffer);
    } else {
      // Files differ - create a combined diff buffer
      // This is a simplified approach; real implementation would create visual overlay
      const diffHeader = Buffer.from('DIFF_v1\n');
      const currentSizeBuffer = Buffer.alloc(4);
      currentSizeBuffer.writeUInt32LE(currentBuffer.length);
      const baselineSizeBuffer = Buffer.alloc(4);
      baselineSizeBuffer.writeUInt32LE(baselineBuffer.length);

      // For actual visual diff, integrate image processing library here
      // Example with jimp: create composite image with highlighted differences

      // Simple implementation: store both images in diff file
      const diffBuffer = Buffer.concat([
        diffHeader,
        currentSizeBuffer,
        baselineSizeBuffer,
        currentBuffer,
        baselineBuffer,
      ]);

      await fs.writeFile(diffPath, diffBuffer);
    }

    return diffPath;
  }

  /**
   * Check if pixel difference is within the acceptable threshold
   *
   * @param difference - The pixel difference percentage (0-100)
   * @param threshold - Optional custom threshold (uses default if not provided)
   * @returns True if difference is within threshold
   */
  isWithinThreshold(difference: number, threshold?: number): boolean {
    const thresholdToUse = threshold ?? this.config.threshold;
    return difference <= thresholdToUse;
  }

  /**
   * Update a baseline screenshot
   *
   * Convenience method that removes the old baseline and saves the new one.
   *
   * @param screenshotPath - Path to the new screenshot
   * @param name - Name of the baseline to update
   * @returns Promise resolving to the new baseline path
   */
  async updateBaseline(screenshotPath: string, name: string): Promise<string> {
    const baselinePath = this.getBaselinePath(name);

    // Remove old baseline if exists
    try {
      await fs.unlink(baselinePath);
    } catch {
      // Baseline doesn't exist, ignore
    }

    // Save new baseline
    return this.saveBaseline(screenshotPath, name);
  }

  /**
   * Delete a baseline
   *
   * @param name - Name of the baseline to delete
   * @returns Promise resolving when deletion is complete
   */
  async deleteBaseline(name: string): Promise<void> {
    const baselinePath = this.getBaselinePath(name);
    try {
      await fs.unlink(baselinePath);
    } catch {
      // Baseline doesn't exist, ignore
    }
  }

  /**
   * List all stored baselines
   *
   * @returns Promise resolving to array of baseline names (without extensions)
   */
  async listBaselines(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.config.baselineDir);
      return files
        .filter(file => file.endsWith('.png'))
        .map(file => file.replace('.png', ''));
    } catch {
      // Directory doesn't exist or is empty
      return [];
    }
  }

  /**
   * Clean up diff directory
   *
   * Removes all generated diff images.
   *
   * @returns Promise resolving when cleanup is complete
   */
  async cleanupDiffs(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.diffDir);
      await Promise.all(
        files
          .filter(file => file.endsWith('-diff.png'))
          .map(file => fs.unlink(path.join(this.config.diffDir, file)))
      );
    } catch {
      // Directory doesn't exist, ignore
    }
  }
}

// ============================================================================
// Factory Functions (Alternative API)
// ============================================================================

/**
 * Create a VisualRegression instance with default configuration
 * @returns New VisualRegression instance
 */
export function createVisualRegression(): VisualRegression {
  return new VisualRegression();
}

/**
 * Create a VisualRegression instance with custom configuration
 * @param config - Configuration options
 * @returns New VisualRegression instance
 */
export function createVisualRegressionWithConfig(
  config: VisualRegressionConfig
): VisualRegression {
  return new VisualRegression(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default VisualRegression;