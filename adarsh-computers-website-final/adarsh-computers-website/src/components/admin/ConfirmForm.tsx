"use client";
import type { ReactNode, FormEvent } from "react";

type FormAction = (formData: FormData) => void | Promise<void>;
export function ConfirmForm({ action, message, children, className }: { action: FormAction; message: string; children: ReactNode; className?: string }) {
  function confirmSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(message)) event.preventDefault();
  }
  return <form action={action} onSubmit={confirmSubmit} className={className}>{children}</form>;
}
