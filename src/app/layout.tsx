import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import { ScriptProvider } from "@/components/ScriptProvider";

export const metadata: Metadata = {
  title: {
    default: "Org Struktura — korxona tashkiliy tuzilmasi konstruktori",
    template: "%s · Org Struktura",
  },
  description:
    "Korxonangizning tashkiliy tuzilmasini vizual tuzing: direktor, bo'limlar, har bir lavozimning vazifalari va javobgarligi. PDF ko'rinishida eksport qiling.",
  applicationName: "Org Struktura",
  openGraph: {
    title: "Org Struktura",
    description: "Korxona tashkiliy tuzilmasini vizual tuzish va PDF eksport qilish xizmati.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

const THEME_BOOTSTRAP = `
(function(){try{
  var t = localStorage.getItem('org-theme');
  if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
  var s = localStorage.getItem('org-script');
  if (s === 'cyrl' || s === 'latn') document.documentElement.setAttribute('data-script', s);
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <ScriptProvider>{children}</ScriptProvider>
      </body>
    </html>
  );
}
