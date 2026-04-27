const fmt = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

export function formatEur(cents: number): string {
  return fmt.format(cents / 100);
}

export function eurToCents(eur: number): number {
  return Math.round(Number((eur * 100).toPrecision(15)));
}

export function centsToEur(cents: number): number {
  return cents / 100;
}
