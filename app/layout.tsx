import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Manrope: distinctive geometric sans, beautiful at display weights.
// Variable axis 200..800 covers everything from labels to the 800-weight hero headlines.
const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// JetBrains Mono: technical / engineering character without the
// "developer joke" feel of Fira Code or the genericness of system mono.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "compramososeueletrico — Vendemos o teu elétrico em poucas horas",
  description:
    "Vende o teu carro elétrico usado de forma simples, rápida e segura. Avaliação gratuita, proposta em minutos, pagamento garantido.",
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: "https://compramososeueletrico.pt",
    siteName: "compramososeueletrico",
    title: "compramososeueletrico — Vendemos o teu elétrico em poucas horas",
    description:
      "Vende o teu carro elétrico usado de forma simples, rápida e segura. Avaliação gratuita, proposta em minutos, pagamento garantido.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-PT"
      className={`${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
