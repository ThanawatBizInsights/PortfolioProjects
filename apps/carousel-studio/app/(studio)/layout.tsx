import Link from 'next/link';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="nav">
        <span className="logo">Carousel Studio</span>
        <Link href="/">Calendar</Link>
        <Link href="/posts/new">+ New carousel</Link>
        <Link href="/settings">Settings</Link>
        <span className="spacer" />
        <span className="muted small">Times are Asia/Bangkok · manual-first, automation-ready</span>
      </nav>
      <main className="main">{children}</main>
    </>
  );
}
