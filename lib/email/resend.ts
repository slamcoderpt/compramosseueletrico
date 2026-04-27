import { Resend } from "resend";

let resend: Resend | null = null;
function client() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendOperatorEmail(opts: { subject: string; html: string }) {
  const to = (process.env.OPERATOR_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const from = process.env.RESEND_FROM;
  if (!from) throw new Error("RESEND_FROM missing");
  if (to.length === 0) throw new Error("OPERATOR_EMAIL empty");
  const { data, error } = await client().emails.send({
    from,
    to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) throw new Error(`Resend error: ${(error as { message: string }).message}`);
  return { id: data!.id };
}

export function renderNewLeadHtml(lead: {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  nome: string;
}) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/leads/${lead.id}`;
  return `
    <p>Novo lead: <strong>${lead.marca} ${lead.modelo} ${lead.ano}</strong></p>
    <p>Cliente: ${lead.nome}</p>
    <p><a href="${url}">Abrir no admin</a></p>
  `.trim();
}
