import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { LegalLinks } from '../app/src/components/LegalLinks';

describe('legal document links',()=>{
  it('opens both bundled PDFs safely in a new tab',()=>{
    render(<LegalLinks/>);

    const privacy=screen.getByRole('link',{name:'Privacy Policy'});
    const terms=screen.getByRole('link',{name:'Terms of Service'});
    expect(privacy.getAttribute('href')).toBe('/Privacy%20Policy.pdf');
    expect(terms.getAttribute('href')).toBe('/Terms%20of%20Service.pdf');
    for(const link of [privacy,terms]){
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('publishes both documents from the application root',()=>{
    expect(fs.existsSync('app/public/Privacy Policy.pdf')).toBe(true);
    expect(fs.existsSync('app/public/Terms of Service.pdf')).toBe(true);
  });

  it('is rendered on both login and authenticated screens',()=>{
    expect(fs.readFileSync('app/src/components/LoginPage.tsx','utf8')).toContain('<LegalLinks/>');
    expect(fs.readFileSync('app/src/App.tsx','utf8')).toContain('<LegalLinks/>');
  });
});
