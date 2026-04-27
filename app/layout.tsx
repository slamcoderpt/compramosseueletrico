import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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
      className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
