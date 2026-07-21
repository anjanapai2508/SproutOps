import { describe,expect,it } from 'vitest';
import fs from 'node:fs';

const html=fs.readFileSync('app/index.html','utf8');
const styles=fs.readFileSync('app/src/styles.css','utf8');

describe('DM Sans typography',()=>{
  it('loads DM Sans with the supported application weights',()=>{
    expect(html).toContain('family=DM+Sans:wght@400;500;600;700');
    expect(html).not.toContain('Manrope');
  });

  it('uses one global DM Sans fallback stack',()=>{
    expect(styles).toContain('--font-sans: "DM Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;');
    expect(styles).toContain('html, body, #app');
    expect(styles).not.toContain('Manrope');
  });
});
