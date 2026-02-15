import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
    title: "ES STORE — Gestion de Boutique",
    description: "Application de gestion commerciale pour boutique de téléphones. Stock, ventes, troc et reporting financier.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
            <body>
                <AppShell>{children}</AppShell>
            </body>
        </html>
    );
}
