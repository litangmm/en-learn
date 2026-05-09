#!/usr/bin/env node
/**
 * Archive agent experience files when they exceed 50 entries.
 * Keeps summary sections, moves old proposal entries to archive/.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPERIENCE_DIR = path.join(__dirname, '../../.claude/evolution/experience');
const AGENTS_DIR = path.join(EXPERIENCE_DIR, 'agents');
const ARCHIVE_DIR = path.join(EXPERIENCE_DIR, 'archive');
const MAX_ENTRIES = 50;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function extractProposalEntries(content) {
  const lines = content.split('\n');
  let inHistory = false;
  const entries = [];
  let currentEntry = [];

  for (const line of lines) {
    // Detect history section
    if (line.match(/^##\s+历史提案/)) {
      inHistory = true;
      continue;
    }
    // If we hit another ## section after history, history is done
    if (inHistory && line.match(/^##\s+/)) {
      if (currentEntry.length > 0) {
        entries.push(currentEntry.join('\n'));
      }
      inHistory = false;
      break;
    }
    // Inside history section, collect ### entries
    if (inHistory) {
      if (line.match(/^###\s+\d{4}-\d{2}-\d{2}/)) {
        if (currentEntry.length > 0) {
          entries.push(currentEntry.join('\n'));
        }
        currentEntry = [line];
      } else if (currentEntry.length > 0) {
        currentEntry.push(line);
      }
    }
  }

  if (inHistory && currentEntry.length > 0) {
    entries.push(currentEntry.join('\n'));
  }

  return entries;
}

function rebuildAgentFile(content, entriesToKeep) {
  const lines = content.split('\n');
  let inHistory = false;
  let historyStartIndex = -1;
  let historyEndIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^##\s+历史提案/)) {
      inHistory = true;
      historyStartIndex = i;
      continue;
    }
    if (inHistory && lines[i].match(/^##\s+/)) {
      historyEndIndex = i;
      break;
    }
  }

  if (historyStartIndex === -1) return content;

  const beforeHistory = lines.slice(0, historyStartIndex + 1);
  const afterHistory = historyEndIndex === -1 ? [] : lines.slice(historyEndIndex);

  const newLines = [
    ...beforeHistory,
    '',
    ...entriesToKeep.join('\n\n').split('\n'),
    ...afterHistory
  ];

  return newLines.join('\n').trim() + '\n';
}

function archiveAgentFile(filename) {
  const filepath = path.join(AGENTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');

  const entries = extractProposalEntries(content);
  if (entries.length <= MAX_ENTRIES) {
    console.log(`  ${filename}: ${entries.length} entries (<= ${MAX_ENTRIES}), no archive needed`);
    return 0;
  }

  const entriesToKeep = entries.slice(-MAX_ENTRIES);
  const entriesToArchive = entries.slice(0, entries.length - MAX_ENTRIES);

  const newContent = rebuildAgentFile(content, entriesToKeep);
  fs.writeFileSync(filepath, newContent);

  // Write archive
  ensureDir(ARCHIVE_DIR);
  const timestamp = new Date().toISOString().slice(0, 10);
  const archiveName = `${timestamp}-${filename.replace('.md', '')}-archive.md`;
  const archivePath = path.join(ARCHIVE_DIR, archiveName);

  const archiveContent = `# ${filename.replace('.md', '')} Archived Proposals\n\n` +
    `Archived at: ${new Date().toISOString()}\n` +
    `Original entries: ${entries.length}\n` +
    `Kept: ${entriesToKeep.length}\n` +
    `Archived: ${entriesToArchive.length}\n\n` +
    `---\n\n` +
    entriesToArchive.join('\n\n') + '\n';

  fs.writeFileSync(archivePath, archiveContent);

  console.log(`  ${filename}: archived ${entriesToArchive.length} entries to ${archiveName}`);
  return entriesToArchive.length;
}

function main() {
  ensureDir(ARCHIVE_DIR);
  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  let totalArchived = 0;

  console.log('Archiving agent experience files...');
  for (const file of files) {
    totalArchived += archiveAgentFile(file);
  }

  console.log(`Done. Total archived entries: ${totalArchived}`);
}

main();
