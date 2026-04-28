import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Mail, Phone, Clock } from "lucide-react";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isValidTokenShape } from "@/lib/proposals/tokens";
import { BookingEmbed } from "./booking-embed";

export const metadata = {
  title: "Marcar visita — compramososeueletrico",
  description: "Escolhe o melhor horário para a inspeção do teu carro elétrico.",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function MarcarPage({ params }: PageProps) {
  const { token } = await params;
  if (!isValidTokenShape(token)) notFound();

  const supabase = createServiceRoleClient();
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, status, leads:lead_id(nome, email, marca, modelo, telefone)")
    .eq("token", token)
    .maybeSingle();

  if (!proposal) notFound();

  const lead = (proposal as any).leads;
  const calLink = process.env.CALCOM_EVENT_TYPE_LINK;

  if (!calLink) {
    return <Fallback token={token} />;
  }

  return (
    <main className="container mx-auto max-w-4xl py-8 px-4">
      <header className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">Marca a tua visita</h1>
        <p className="text-muted-foreground">
          Escolhe um horário para o {lead.marca} {lead.modelo}. A inspeção demora cerca de 30 minutos.
        </p>
      </header>
      <BookingEmbed
        calLink={calLink}
        token={token}
        prefillName={lead.nome}
        prefillEmail={lead.email}
      />
      <p className="text-xs text-muted-foreground/60 text-center mt-6 font-mono">
        Refª {token.slice(0, 8)}
      </p>
    </main>
  );
}

function Fallback({ token }: { token: string }) {
  return (
    <main className="container mx-auto max-w-lg py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 size-16 rounded-full bg-primary/10 grid place-items-center text-primary">
            <Calendar className="size-8" />
          </div>
          <CardTitle className="text-2xl">Marcação de visita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            A marcação online estará disponível em breve. Por agora, contacta-nos para combinar.
          </p>
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="size-4 text-muted-foreground" />
              <span className="font-mono">+351 21X XXX XXX</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="size-4 text-muted-foreground" />
              <span className="font-mono">ola@compramososeueletrico.pt</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="size-4 text-muted-foreground" />
              <span>9h-19h, dias úteis</span>
            </div>
          </div>
          <Alert>
            <AlertDescription>
              Recebemos a tua aceitação. Vamos contactar-te dentro de 24h se não nos contactares antes.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Link
              href={`/proposta/${token}/aceite`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Voltar
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/60 text-center font-mono">
            Refª {token.slice(0, 8)}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
