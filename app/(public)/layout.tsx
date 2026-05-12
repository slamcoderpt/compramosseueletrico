import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "351936262148"; // E.164 sem +
const WHATSAPP_MSG = encodeURIComponent(
  "Olá! Gostava de saber mais sobre a venda do meu carro elétrico."
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="compramososeueletrico — página inicial"
          >
            {/* Battery mark — monochrome with single brand-teal cell */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="4"
                width="16"
                height="14"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-foreground"
              />
              <rect
                x="19"
                y="9"
                width="2"
                height="5"
                rx="0.5"
                fill="currentColor"
                className="text-foreground"
              />
              {/* Single charge cell — the lone brand accent */}
              <rect x="5" y="6" width="6" height="10" rx="0.5" fill="var(--brand)" />
            </svg>
            <span className="font-semibold text-[13px] tracking-tight leading-none text-foreground">
              compramososeueletrico
            </span>
          </Link>

          {/* Header actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* WhatsApp — visible on sm+ */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar no WhatsApp"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 h-9 text-[12px] font-medium text-foreground/80 hover:text-foreground hover:border-border transition-colors"
              style={{ boxShadow: "0 1px 2px oklch(0 0 0 / 0.04)" }}
            >
              {/* WhatsApp icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: "#25D366" }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>

            <Link href="/avaliar" className={cn(buttonVariants({ size: "sm" }), "shrink-0")}>
              Avaliar o meu EV
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            {/* Brand + legal info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="4"
                    width="16"
                    height="14"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-foreground"
                  />
                  <rect
                    x="19"
                    y="9"
                    width="2"
                    height="5"
                    rx="0.5"
                    fill="currentColor"
                    className="text-foreground"
                  />
                  <rect x="5" y="6" width="6" height="10" rx="0.5" fill="var(--brand)" />
                </svg>
                <span className="text-[13px] font-medium text-foreground">
                  compramososeueletrico
                </span>
              </div>
              {/* TODO: adicionar NIF e morada da Lesscode Consulting Lda antes do lançamento */}
            </div>

            {/* Legal links + WhatsApp */}
            <nav aria-label="Links legais" className="flex flex-wrap gap-x-4 gap-y-2">
              {[
                { href: "/politica-privacidade", label: "Política de Privacidade" },
                { href: "/termos", label: "Termos e Condições" },
                { href: "/cookies", label: "Cookies" },
                { href: "/contacto", label: "Contacto" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                WhatsApp
              </a>
            </nav>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} compramososeueletrico. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
