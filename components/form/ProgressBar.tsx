export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="text-sm text-muted-foreground mb-4">
      Passo {current} de {total}
    </div>
  );
}
