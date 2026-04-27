"use client";
import { useFormContext } from "react-hook-form";
export function Step2Condition() {
  const { register } = useFormContext();
  return (
    <div className="space-y-3">
      <label className="block">
        Quilómetros
        <input type="number" {...register("km", { valueAsNumber: true })} className="border p-2 w-full" />
      </label>
      <label className="block">
        Cor (opcional)
        <input {...register("cor")} className="border p-2 w-full" />
      </label>
      <label className="block">
        Nº de donos anteriores
        <input type="number" {...register("num_donos_anteriores", { valueAsNumber: true })} className="border p-2 w-full" />
      </label>
      <label className="block">
        Estado geral
        <select {...register("estado_geral")} className="border p-2 w-full">
          <option value="">—</option>
          <option value="OPTIMO">Ótimo</option>
          <option value="BOM">Bom</option>
          <option value="RAZOAVEL">Razoável</option>
          <option value="MAU">Mau</option>
        </select>
      </label>
      <label className="block">
        Sinistros
        <select {...register("sinistros")} className="border p-2 w-full">
          <option value="">—</option>
          <option value="NUNCA">Nunca</option>
          <option value="LIGEIROS">Ligeiros</option>
          <option value="GRAVES">Graves</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" {...register("livro_manutencao")} /> Livro de manutenção
      </label>
    </div>
  );
}
