# Bundle Size Baseline

## Purpose

This directory stores the baseline bundle size data for the en-learn project. The data is captured before and after significant changes to track the impact of new features on build size.

## Files

- `bundle-sizes.json` — Baseline chunk sizes captured at specific versions

## Understanding the Data

### Thresholds

| Threshold | Value | Meaning |
|-----------|-------|---------|
| mainChunkRawKB | 650 | Main chunk raw size limit (warning at >520KB) |
| mainChunkGzipKB | 200 | Main chunk gzip size limit |
| totalGzipKB | 600 | Total gzip size budget |

### Manual Chunks

The Vite config splits vendor code into:
- `vendor-recharts` — Charting library
- `vendor-radix` — Radix UI primitives
- `vendor-framer` — Animation library
- `vendor-router` — React Router
- `vendor-misc` — Other vendors

Dictionary code is split into separate chunks: `gre`, `ielts`, `toefl`, `cet4`, `cet6`, `senior`, `junior`

## Usage

### Run Analysis

```bash
# Generate visual bundle report
npm run build:analyze

# Check chunk sizes
npm run build
```

The `dist/stats.html` file will be generated for visual inspection.

### Check Against Baseline

After running `npm run build`, compare output against thresholds in `bundle-sizes.json`. Vite will warn if any chunk exceeds `chunkSizeWarningLimit` (650KB).

### Add New Baseline

When significant changes are made:
1. Update `bundle-sizes.json` with new version and captured sizes
2. Commit the updated baseline

## Version History

- v0.24.0 — Initial baseline with manualChunks configured