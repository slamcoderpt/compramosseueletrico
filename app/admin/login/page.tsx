import { LoginForm } from "./login-form";

const ERROR_MESSAGES: Record<string, string> = {
  no_access: "Esta conta não tem permissões de operador.",
  exchange_failed: "O link expirou ou é inválido. Pede um novo.",
  missing_code: "Link mal formatado.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? (ERROR_MESSAGES[params.error] ?? "Ocorreu um erro.") : undefined;

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-12 bg-[oklch(0.96_0.012_185)]">
      {/* Subtle teal-washed background */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.88 0.06 185 / 0.35) 0%, transparent 70%), oklch(0.97 0.008 185)",
        }}
      />

      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <p
            className="text-xs font-mono tracking-[0.2em] uppercase text-[oklch(0.48_0.13_185)] mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Acesso de operador
          </p>
          <h1
            className="text-xl font-semibold tracking-tight text-[oklch(0.14_0.012_260)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            compramososeueletrico
          </h1>
          <div className="mt-3 mx-auto h-px w-12 bg-[oklch(0.48_0.13_185_/_0.4)]" />
        </div>

        <LoginForm errorMessage={errorMessage} />

        <p className="mt-6 text-center text-xs text-[oklch(0.50_0.010_260)]">
          Não tens acesso?{" "}
          <span className="text-[oklch(0.48_0.13_185)]">Contacta a equipa.</span>
        </p>
      </div>
    </main>
  );
}
