import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const html = fs.readFileSync(path.resolve(__dirname, '../app/index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1] || '';
const styles = html.match(/<style>([\s\S]*)<\/style>/)?.[1] || '';

describe('SproutOps workflow enhancements', () => {
  it('centralizes the design palette behind semantic CSS tokens', () => {
    expect(styles).toContain('--background:#FAFAF8');
    expect(styles).toContain('--text-primary:#1F2937');
    expect(styles).toContain('--input-focus:#239CC3');
    expect(styles).toContain('--progress-value:#73B52B');

    const componentStyles = styles.replace(/:root\s*\{[\s\S]*?\}/, '');
    expect(componentStyles).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('removes divider and highlight effects from expanded video cards only', () => {
    expect(styles).toContain('.accordion-details { padding:0 18px 18px; }');
    expect(styles).toContain('.video-card-wrap:has(.video-card[aria-expanded="true"]) { box-shadow:none; }');
    expect(styles).toContain('.video-card[aria-expanded="true"]:hover { transform:none; background:transparent; box-shadow:none; }');
    expect(styles).toContain('box-shadow:var(--card-shadow)');
  });

  it('renders each workflow section as an independently controlled accordion', () => {
    expect(script).toContain('expandedSections:{}');
    expect(script).toContain('data-action="toggle-section"');
    expect(script).toContain('data-section-id="editing"');
    expect(script).toContain('aria-expanded="${expanded}"');
    expect(script).toContain("renderTaskSection('PRE-PRODUCTION'");
    expect(script).toContain("renderTaskSection('PRODUCTION'");
    expect(script).toContain("renderTaskSection('PUBLISHING'");
  });

  it('provides an editable latest-version filename and persists non-empty changes', () => {
    expect(script).toContain('data-action="edit-version-filename"');
    expect(script).toContain('active.fileName=fileName');
    expect(script).toContain('if(!active||!fileName){ render(); return; }');
  });

  it('offers all editing statuses and counts Done as completed progress', () => {
    expect(script).toContain('>Ready for edit</option>');
    expect(script).toContain('>Ready for review</option>');
    expect(script).toContain('>Done</option>');
    expect(script).toContain("done:'approved'");
    expect(script).toContain("active?.status==='approved'?1:0");
    expect(script).toContain('active.status=status');
  });
});
