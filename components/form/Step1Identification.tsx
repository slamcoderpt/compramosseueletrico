"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { ChevronsUpDown, Check, Info } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const EV_BRANDS = [
  "Tesla", "Renault", "Nissan", "Volkswagen", "Hyundai", "Kia", "Peugeot",
  "Citroën", "Opel", "BMW", "Mercedes-Benz", "Audi", "Volvo", "Ford", "Smart",
  "MG", "BYD", "Polestar", "Skoda", "SEAT", "Cupra", "Fiat", "Mini", "Honda",
  "Mazda", "Porsche", "Jaguar", "Toyota", "DS Automobiles",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR + 1 - 2010 + 1 },
  (_, i) => 2010 + i
).reverse();

function applyMatriculaMask(raw: string): string {
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6);
  if (clean.length <= 2) return clean;
  if (clean.length <= 4) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4)}`;
}

export function Step1Identification() {
  const { control, formState } = useFormContext();
  const [brandOpen, setBrandOpen] = React.useState(false);
  const [brandSearch, setBrandSearch] = React.useState("");

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Que carro queres vender?
        </h2>
        <p className="text-muted-foreground text-sm">Começamos pelo básico.</p>
      </div>

      {/* matrícula — plain label+id for test compatibility */}
      <FormField
        control={control}
        name="matricula"
        render={({ field }) => (
          <FormItem>
            <label
              htmlFor="matricula"
              className={cn(
                "text-sm font-medium leading-none",
                formState.errors.matricula
                  ? "text-destructive"
                  : "text-foreground"
              )}
            >
              matrícula
            </label>
            <Input
              {...field}
              id="matricula"
              className={cn(
                "font-mono uppercase tracking-widest text-base h-11 pl-3 mt-1",
                formState.errors.matricula &&
                  "border-destructive focus-visible:ring-destructive/20"
              )}
              placeholder="AA-11-BB"
              maxLength={8}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                const masked = applyMatriculaMask(e.target.value);
                field.onChange(masked);
              }}
              value={field.value ?? ""}
            />
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Info className="size-3 shrink-0" />
              Formato: AA-11-BB
            </p>
            {formState.errors.matricula && (
              <p className="text-destructive text-sm mt-1">
                {String(formState.errors.matricula.message ?? "")}
              </p>
            )}
          </FormItem>
        )}
      />

      {/* marca — combobox */}
      <FormField
        control={control}
        name="marca"
        render={({ field }) => {
          const filteredBrands = EV_BRANDS.filter((b) =>
            b.toLowerCase().includes(brandSearch.toLowerCase())
          );
          const showCustom =
            brandSearch.length > 0 &&
            !EV_BRANDS.some(
              (b) => b.toLowerCase() === brandSearch.toLowerCase()
            );

          return (
            <FormItem>
              <FormLabel className="text-sm font-medium">Marca</FormLabel>
              <FormControl>
                <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                  <PopoverTrigger
                    role="combobox"
                    className={cn(
                      "flex h-11 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      !field.value && "text-muted-foreground",
                      formState.errors.marca && "border-destructive"
                    )}
                  >
                    <span className="truncate">
                      {field.value || "Seleciona ou escreve a marca"}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-72 p-0"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Pesquisar marca..."
                        value={brandSearch}
                        onValueChange={(v) => {
                          setBrandSearch(v);
                          field.onChange(v);
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {brandSearch.length > 0 ? (
                            <span className="text-xs px-2">
                              Nenhuma marca encontrada
                            </span>
                          ) : null}
                        </CommandEmpty>
                        {showCustom && (
                          <CommandGroup heading="Personalizado">
                            <CommandItem
                              value={brandSearch}
                              onSelect={() => {
                                field.onChange(brandSearch);
                                setBrandSearch("");
                                setBrandOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  field.value === brandSearch
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {brandSearch}
                            </CommandItem>
                          </CommandGroup>
                        )}
                        <CommandGroup heading="Marcas populares">
                          {filteredBrands.map((brand) => (
                            <CommandItem
                              key={brand}
                              value={brand}
                              onSelect={(v) => {
                                field.onChange(v);
                                setBrandSearch("");
                                setBrandOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  field.value === brand
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {brand}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* modelo */}
      <FormField
        control={control}
        name="modelo"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Modelo</FormLabel>
            <FormControl>
              <Input
                {...field}
                id="modelo"
                className={cn(
                  "h-11",
                  formState.errors.modelo &&
                    "border-destructive focus-visible:ring-destructive/20"
                )}
                placeholder="ex: Model 3, Zoe, Leaf"
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* versao + ano — paired on ≥768px */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="versao"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Versão{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="versao"
                  className="h-11"
                  placeholder="ex: Long Range, GT, e+, etc."
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="ano"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Ano</FormLabel>
              <FormControl>
                <div>
                  <select
                    id="ano"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? undefined : Number(v));
                    }}
                    className={cn(
                      "flex h-11 w-full items-center rounded-lg border border-input bg-transparent px-3 py-2 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      !field.value && "text-muted-foreground",
                      formState.errors.ano && "border-destructive"
                    )}
                  >
                    <option value="">Seleciona o ano</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
