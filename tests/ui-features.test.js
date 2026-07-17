import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, '../app/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptContent = html.match(/<script>([\s\S]*)<\/script>/)?.[1] || '';

describe('SproutOps UI features', () => {
  it('renders serial-numbered video cards in the board view', () => {
    expect(html).toContain('#${serial}');
    expect(scriptContent).toContain('getVideoNumber(video, orderedVideos)');
    expect(scriptContent).toContain('getOrderedVideos');
  });

  it('includes a compact editing summary with comment composer and action buttons', () => {
    expect(scriptContent).toContain('function renderEditingWorkspace(video)');
    expect(scriptContent).toContain('data-action="open-version-history"');
    expect(scriptContent).toContain('data-action="open-discussion"');
    expect(scriptContent).toContain('placeholder="Write a comment..."');
  });

  it('uses a simplified accordion detail view without the old progress hero block', () => {
    expect(scriptContent).toContain('function renderAccordionDetails(video)');
    expect(scriptContent).toContain('return `<div class="accordion-details"><div class="detail-workflow">');
    expect(scriptContent).not.toContain('function renderAccordionDetails(video) { const progress');
    expect(scriptContent).not.toContain('return `<div class="accordion-details"><section class="detail-hero">');
  });
});
