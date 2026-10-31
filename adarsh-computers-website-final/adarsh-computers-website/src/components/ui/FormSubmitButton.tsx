"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type FormSubmitButtonProps = ButtonProps & { pendingText: string };

export function FormSubmitButton({ pendingText, children, disabled, ...props }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  return <Button type="submit" {...props} disabled={disabled || pending} aria-busy={pending}>
    {pending && <LoaderCircle className="spin" size={16} aria-hidden="true" />}
    {pending ? pendingText : children}
  </Button>;
}
