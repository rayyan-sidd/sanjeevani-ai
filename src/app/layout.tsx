import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

// Modern, clean font for medical clarity
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Sanjeevani AI | Healthcare for Rural India",
  description: "Advanced AI triage and emergency SOS system for low-bandwidth regions.",
  manifest: "/manifest.json", // For Phase 7 PWA support
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <AuthProvider>
          {/* Main App Content */}
          {children}

          {/* PHASE 8 OPTIMIZATION: 
              'Sonner' Toaster handles all SOS and AI feedback.
              We use 'richColors' for high-contrast alerts.
          */}
          <Toaster 
            position="top-right" 
            richColors 
            expand={false}
            closeButton
            theme="light"
            toastOptions={{
              style: {
                borderRadius: '1.25rem',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}