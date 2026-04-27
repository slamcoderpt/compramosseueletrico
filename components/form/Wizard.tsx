"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  fullLeadSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  type FullLead,
} from "@/lib/validation/lead-schema";
import { Step1Identification } from "./Step1Identification";
import { Step2Condition } from "./Step2Condition";
import { Step3Battery } from "./Step3Battery";
import { Step4Contact } from "./Step4Contact";
import { ProgressBar } from "./ProgressBar";

const DRAFT_KEY = "avaliar-draft";
const stepSchemas = [step1Schema, step2Schema, step3Schema, step4Schema];

export function Wizard() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<Partial<FullLead>>({
    mode: "onBlur",
    defaultValues: typeof window !== "undefined" ? loadDraft() : {},
  });

  useEffect(() => {
    const sub = methods.watch((v) => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(v));
    });
    return () => sub.unsubscribe();
  }, [methods]);

  async function next() {
    const schema = stepSchemas[step - 1];
    const values = methods.getValues();
    const r = schema.safeParse(values);
    if (!r.success) {
      r.error.issues.forEach((i) =>
        methods.setError(i.path.join(".") as Parameters<typeof methods.setError>[0], { message: i.message })
      );
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function submit() {
    setError(null);
    const values = methods.getValues();
    const r = fullLeadSchema.safeParse(values);
    if (!r.success) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(r.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? "Erro ao submeter. Tenta de novo.");
        return;
      }
      const data = await res.json();
      localStorage.removeItem(DRAFT_KEY);
      window.location.assign(`/avaliar/obrigado?ref=${data.ref}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <ProgressBar current={step} total={4} />
      <div data-testid="wizard-step" className="sr-only">{step}</div>
      {step === 1 && <Step1Identification />}
      {step === 2 && <Step2Condition />}
      {step === 3 && <Step3Battery />}
      {step === 4 && <Step4Contact />}
      <NavButtons step={step} onNext={next} onBack={back} onSubmit={submit} submitting={submitting} />
      {error && <p role="alert" className="text-red-600 mt-4">{error}</p>}
    </FormProvider>
  );
}

function NavButtons({
  step,
  onBack,
  onNext,
  onSubmit,
  submitting,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="flex justify-between mt-6">
      {step > 1 ? <button type="button" onClick={onBack}>Voltar</button> : <span />}
      {step < 4 ? (
        <button type="button" onClick={onNext}>Seguinte</button>
      ) : (
        <button type="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? "A enviar..." : "Receber proposta"}
        </button>
      )}
    </div>
  );
}

function loadDraft(): Partial<FullLead> {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
  } catch {
    return {};
  }
}
