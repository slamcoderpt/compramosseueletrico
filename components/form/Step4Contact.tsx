"use client";
import { useFormContext } from "react-hook-form";
export function Step4Contact() {
  const { register } = useFormContext();
  return (
    <div className="space-y-3">
      <label className="block">
        Nome
        <input {...register("nome")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Telemóvel
        <input {...register("telefone")} className="border p-2 w-full" placeholder="9XX XXX XXX" />
      </label>
      <label className="block">
        Email
        <input type="email" {...register("email")} className="border p-2 w-full" />
      </label>
      <label className="flex items-start gap-2">
        <input type="checkbox" {...register("rgpd")} className="mt-1" />
        <span>Aceito a política de privacidade e os termos.</span>
      </label>
    </div>
  );
}
