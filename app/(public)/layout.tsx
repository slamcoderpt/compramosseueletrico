import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          <Link href="/" className="flex items-center gap-2 group" aria-label="compramososeueletrico — página inicial">
            {/* Battery charge SVG motif */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
              <rect x="19" y="9" width="2" height="5" rx="1" fill="currentColor" className="text-primary" />
              <rect x="5" y="6" width="6" height="10" rx="1" fill="currentColor" className="text-primary" />
            </svg>
            <span className="font-semibold text-sm tracking-tight leading-none">
              <span className="text-primary">compramos</span>
              <span className="text-foreground">o seu</span>
              <span className="text-primary">elétrico</span>
            </span>
          </Link>

          {/* Single CTA */}
          <Link href="/avaliar" className={cn(buttonVariants({ size: "sm" }), "shrink-0")}>
            Avaliar o meu EV
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            {/* Brand + legal info */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="19" y="9" width="2" height="5" rx="1" fill="currentColor" />
                  <rect x="5" y="6" width="6" height="10" rx="1" fill="currentColor" />
                </svg>
                <span className="text-sm font-medium text-foreground">compramososeueletrico</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                NIF 999 999 999 · Rua Exemplo 123, 1000-000 Lisboa
              </p>
            </div>

            {/* Legal links */}
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
