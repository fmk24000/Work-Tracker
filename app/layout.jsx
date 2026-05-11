import './globals.css';

export const metadata = {
  title: 'Programme Tracker',
  description: 'Programme tracker web application built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
