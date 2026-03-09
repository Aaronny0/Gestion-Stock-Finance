import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
    title: "VORTEX — Gestion de Boutique",
    description: "Application de gestion commerciale pour boutique de téléphones. Stock, ventes, troc et reporting financier.",
};

export const viewport = {
    width: 'device-width',
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
        <html lang="fr" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
            </head>
            <body suppressHydrationWarning>
                <AppShell>{children}</AppShell>
            </body>
        </html>
    );
}
