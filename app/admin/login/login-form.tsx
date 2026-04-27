"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/client";

interface LoginFormProps {
  errorMessage?: string;
}

export function LoginForm({ errorMessage }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReset() {
    setSent(false);
    setSentToEmail("");
    setEmail("");
    setInlineError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInlineError(null);

    startTransition(async () => {
      const supabase = createBrowserSupabase();

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
          shouldCreateUser: false,
        },
      });

      if (error) {
        const msg = error.message ?? "Não foi possível enviar o link. Tenta novamente.";
        setInlineError(msg);
        toast.error("Erro ao enviar link", { description: msg });
        return;
      }

      setSentToEmail(email);
      setSent(true);
    });
  }

  return (
    <Card className="border-[oklch(0.90_0.008_185)] shadow-[0_4px_24px_oklch(0.48_0.13_185_/_0.08)]">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium text-[oklch(0.14_0.012_260)]">
          Entrar
        </CardTitle>
        <CardDescription className="text-[oklch(0.50_0.010_260)] text-sm">
          Recebes um link por email — sem password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error from URL params (e.g. expired link) */}
        {errorMessage && (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {sent ? (
          /* Success state */
          <div className="space-y-4">
            <div className="rounded-lg bg-[oklch(0.94_0.04_185_/_0.4)] border border-[oklch(0.48_0.13_185_/_0.2)] p-4 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-[oklch(0.48_0.13_185)] shrink-0 mt-0.5" />
              <p className="text-sm text-[oklch(0.25_0.015_260)] leading-relaxed">
                Vamos enviar-te um link para{" "}
                <span className="font-medium text-[oklch(0.14_0.012_260)]">{sentToEmail}</span>.{" "}
                Verifica a caixa de entrada (e o spam).
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-[oklch(0.48_0.13_185)] hover:text-[oklch(0.40_0.13_185)] underline underline-offset-2 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[oklch(0.25_0.015_260)]">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[oklch(0.62_0.010_185)] pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="operador@empresa.pt"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  className="pl-9 border-[oklch(0.90_0.008_185)] focus-visible:ring-[oklch(0.48_0.13_185)] placeholder:text-[oklch(0.70_0.008_185)]"
                />
              </div>
            </div>

            {/* Inline error */}
            {inlineError && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{inlineError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isPending || !email}
              className="w-full bg-[oklch(0.48_0.13_185)] hover:bg-[oklch(0.43_0.13_185)] text-[oklch(0.98_0.005_185)] font-medium transition-colors"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  A enviar…
                </span>
              ) : (
                "Enviar link mágico"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
