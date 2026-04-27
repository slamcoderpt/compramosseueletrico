"use client";
import { useFormContext } from "react-hook-form";
export function Step1Identification() {
  const { register } = useFormContext();
  return (
    <div className="space-y-3">
      <label className="block">
        Matrícula
        <input {...register("matricula")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Marca
        <input {...register("marca")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Modelo
        <input {...register("modelo")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Versão (opcional)
        <input {...register("versao")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Ano
        <input type="number" {...register("ano", { valueAsNumber: true })} className="border p-2 w-full" />
      </label>
    </div>
  );
}
