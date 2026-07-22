export function LegalLinks() {
  const linkClass='rounded-lg px-2 py-1.5 font-medium transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300';
  return <footer className="flex flex-wrap justify-center gap-1 pt-8 text-xs text-slate-400" aria-label="Legal documents"><a className={linkClass} href="/PrivacyPolicy.pdf" target="_blank" rel="noopener noreferrer">Privacy Policy</a><a className={linkClass} href="/TermsOfService.pdf" target="_blank" rel="noopener noreferrer">Terms of Service</a></footer>;
}
