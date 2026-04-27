import { Copy, Mail, Phone } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPtDateTime } from "@/lib/format/date";

// ─── Types ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Lead = Record<string, any>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ESTADO_GERAL: Record<string, string> = {
  OPTIMO: "Óptimo",
  BOM: "Bom",
  RAZOAVEL: "Razoável",
  MAU: "Mau",
};

const SINISTROS: Record<string, string> = {
  NUNCA: "Nunca",
  LIGEIROS: "Ligeiros",
  GRAVES: "Graves",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-3"
      style={{ fontFamily: "var(--font-mono)", color: "oklch(0.48 0.13 185)" }}
    >
      {children}
    </p>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-1.5 border-b last:border-0" style={{ borderColor: "oklch(1 0 0 / 5%)" }}>
      <p
        className="text-[10px] uppercase tracking-widest mb-0.5"
        style={{ fontFamily: "var(--font-mono)", color: "oklch(0.42 0.006 220)" }}
      >
        {label}
      </p>
      <div
        className="text-sm leading-tight"
        style={{ color: "oklch(0.82 0.008 220)" }}
      >
        {value ?? <span style={{ color: "oklch(0.35 0.005 220)" }}>—</span>}
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  // This is rendered server-side; we use a native button with inline onclick
  // for simple copy — lightweight, no JS import needed.
  return (
    <button
      type="button"
      onClick={undefined}
      data-copy={value}
      className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-[10px] transition-colors"
      style={{
        fontFamily: "var(--font-mono)",
        background: "oklch(0.48 0.13 185 / 0.12)",
        color: "oklch(0.65 0.14 185)",
        cursor: "pointer",
        border: "none",
      }}
      title="Copiar"
    >
      <Copy size={10} />
      copiar
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LeadDeclaration({ lead }: { lead: Lead }) {
  const cardStyle = {
    background: "oklch(0.145 0.013 220)",
    border: "1px solid oklch(1 0 0 / 7%)",
    borderRadius: "8px",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Identificação ── */}
      <div style={cardStyle} className="p-4">
        <SectionTitle>Identificação</SectionTitle>
        <div className="grid grid-cols-2 gap-x-6">
          <Field
            label="Matrícula"
            value={
              lead.matricula ? (
                <span className="flex items-center gap-1 flex-wrap">
                  <span
                    className="text-sm tracking-widest font-semibold"
                    style={{ fontFamily: "var(--font-mono)", color: "oklch(0.88 0.012 220)" }}
                  >
                    {lead.matricula}
                  </span>
                  <CopyButton value={lead.matricula} />
                </span>
              ) : null
            }
          />
          <Field label="Marca" value={lead.marca} />
          <Field label="Modelo" value={lead.modelo} />
          <Field label="Versão" value={lead.versao ?? null} />
          <Field label="Ano" value={lead.ano ? String(lead.ano) : null} />
        </div>
      </div>

      {/* ── Estado ── */}
      <div style={cardStyle} className="p-4">
        <SectionTitle>Estado</SectionTitle>
        <div className="grid grid-cols-2 gap-x-6">
          <Field
            label="Km"
            value={
              lead.km != null ? (
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {lead.km.toLocaleString("pt-PT")} km
                </span>
              ) : null
            }
          />
          <Field label="Cor" value={lead.cor ?? null} />
          <Field
            label="Donos anteriores"
            value={lead.num_donos_anteriores != null ? String(lead.num_donos_anteriores) : null}
          />
          <Field
            label="Estado geral"
            value={lead.estado_geral ? (ESTADO_GERAL[lead.estado_geral] ?? lead.estado_geral) : null}
          />
          <Field
            label="Sinistros"
            value={lead.sinistros ? (SINISTROS[lead.sinistros] ?? lead.sinistros) : null}
          />
          <Field
            label="Livro manutenção"
            value={lead.livro_manutencao != null ? (lead.livro_manutencao ? "Sim" : "Não") : null}
          />
        </div>
      </div>

      {/* ── Bateria & EV ── */}
      <div style={cardStyle} className="p-4">
        <SectionTitle>Bateria &amp; EV</SectionTitle>
        <div className="grid grid-cols-2 gap-x-6">
          <Field
            label="SOH bateria"
            value={
              lead.bateria_soh_pct != null ? (
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {lead.bateria_soh_pct}%
                </span>
              ) : null
            }
          />
          <Field
            label="Autonomia real"
            value={
              lead.autonomia_real_km != null ? (
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {lead.autonomia_real_km} km
                </span>
              ) : null
            }
          />
          <Field
            label="Carregador incluído"
            value={lead.carregador_incluido != null ? (lead.carregador_incluido ? "Sim" : "Não") : null}
          />
        </div>
      </div>

      {/* ── Contacto ── */}
      <div style={cardStyle} className="p-4">
        <SectionTitle>Contacto</SectionTitle>
        <div className="grid grid-cols-2 gap-x-6">
          <Field label="Nome" value={lead.nome} />
          <Field
            label="Telefone"
            value={
              lead.telefone ? (
                <a
                  href={`tel:${lead.telefone}`}
                  className="inline-flex items-center gap-1.5 hover:underline"
                  style={{ fontFamily: "var(--font-mono)", color: "oklch(0.65 0.14 185)" }}
                >
                  <Phone size={11} />
                  {lead.telefone}
                </a>
              ) : null
            }
          />
          <Field
            label="Email"
            value={
              lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 hover:underline truncate max-w-[180px]"
                  style={{ color: "oklch(0.65 0.14 185)" }}
                >
                  <Mail size={11} />
                  {lead.email}
                </a>
              ) : null
            }
          />
          <Field
            label="Consentimento RGPD"
            value={
              lead.rgpd_consent_at ? (
                <span className="text-xs" style={{ color: "oklch(0.55 0.008 220)" }}>
                  {formatPtDateTime(new Date(lead.rgpd_consent_at))}
                </span>
              ) : null
            }
          />
        </div>
      </div>
    </div>
  );
}
