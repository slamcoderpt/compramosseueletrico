"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AcceptRejectButtonsProps {
  token: string;
  valorFormatted: string;
}

export function AcceptRejectButtons({ token, valorFormatted }: AcceptRejectButtonsProps) {
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const acceptFormRef = useRef<HTMLFormElement>(null);
  const rejectFormRef = useRef<HTMLFormElement>(null);

  function handleAcceptConfirm() {
    setAcceptOpen(false);
    // Small delay so dialog closes before navigation
    setTimeout(() => acceptFormRef.current?.submit(), 50);
  }

  function handleRejectConfirm() {
    setRejectOpen(false);
    setTimeout(() => rejectFormRef.current?.submit(), 50);
  }

  return (
    <>
      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1 h-12 text-base font-semibold tracking-tight gap-2 cursor-pointer"
          onClick={() => setAcceptOpen(true)}
          type="button"
        >
          <CheckCircle className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          Aceitar proposta
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 sm:flex-none sm:w-auto h-12 text-base font-normal text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => setRejectOpen(true)}
          type="button"
        >
          <XCircle className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          Recusar
        </Button>
      </div>

      {/* Accept confirmation dialog */}
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <DialogTitle>Confirmar aceitação</DialogTitle>
            </div>
            <DialogDescription>
              Tens a certeza que queres aceitar a proposta de{" "}
              <span className="font-semibold text-foreground font-mono">{valorFormatted}</span>?
              A seguir vais marcar uma visita ao nosso local.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" className="cursor-pointer" />
              }
            >
              Cancelar
            </DialogClose>
            <Button
              onClick={handleAcceptConfirm}
              className="cursor-pointer font-semibold"
            >
              Sim, aceitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject confirmation dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="size-5 text-destructive" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <DialogTitle>Confirmar recusa</DialogTitle>
            </div>
            <DialogDescription>
              Tens a certeza que queres recusar? Esta ação não pode ser anulada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" className="cursor-pointer" />
              }
            >
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              className={cn(
                "cursor-pointer font-semibold",
                "bg-destructive/15 text-destructive hover:bg-destructive/25 focus-visible:border-destructive/40"
              )}
            >
              Sim, recusar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden forms — submitted programmatically */}
      <form
        ref={acceptFormRef}
        action={`/api/proposals/${token}/accept`}
        method="post"
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <form
        ref={rejectFormRef}
        action={`/api/proposals/${token}/reject`}
        method="post"
        style={{ display: "none" }}
        aria-hidden="true"
      />
    </>
  );
}
