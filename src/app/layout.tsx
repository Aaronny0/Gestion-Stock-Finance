import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FrontendShell } from "@/frontend/shell";
import { DesignSystemProvider } from "@/providers/design-system-provider";
export const metadata: Metadata = {
  title: "Vortex · Gestion Stock & Finance",
  description: "Pilotez votre commerce, votre stock et vos finances.",
  appleWebApp: { capable: true, title: "Vortex", statusBarStyle: "default" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4F46E5",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <DesignSystemProvider>
          <FrontendShell>{children}</FrontendShell>
        </DesignSystemProvider>
      </body>
    </html>
  );
}
