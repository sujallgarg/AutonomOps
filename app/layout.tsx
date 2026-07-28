import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutonomOps.ai | Autonomous Front-Office AI Agent for Local Service Businesses',
  description: 'Converts inbound customer inquiries into paid, scheduled appointments. Calculates estimate ranges, collects Stripe deposits, and auto-books Google Calendar slots.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#060911] text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
