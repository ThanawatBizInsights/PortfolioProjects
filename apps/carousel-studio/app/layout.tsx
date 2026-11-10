import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Carousel Studio', description: 'Thai AI carousels for Facebook and Instagram' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
