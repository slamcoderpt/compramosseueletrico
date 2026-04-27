"use client";
import { useFormContext } from "react-hook-form";
export function Step3Battery() {
  const { register } = useFormContext();
  return (
    <div className="space-y-3">
      <label className="block">
        SoH bateria (%)
        <input type="number" {...register("bateria_soh_pct", { valueAsNumber: true })} className="border p-2 w-full" />
      </label>
      <label className="block">
        Autonomia real (km)
        <input type="number" {...register("autonomia_real_km", { valueAsNumber: true })} className="border p-2 w-full" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" {...register("carregador_incluido")} /> Carregador portátil incluído
      </label>
    </div>
  );
}
