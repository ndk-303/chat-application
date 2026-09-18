import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';

export const metadata: Metadata = {
  title: 'Aether Chat — Private WebRTC Communication',
  description: 'End-to-end encrypted real-time communication. Crystal-clear audio and video, always private.',
  metadataBase: new URL('https://aether.chat'),
  openGraph: {
    title: 'Aether Chat',
    description: 'End-to-end encrypted real-time communication.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aether Chat',
    description: 'End-to-end encrypted real-time communication.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        {/* Skip to content — keyboard accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
