import * as React from "react";
import { cn } from "@/lib/utils";

/** Styles partagés par input, textarea et select : un seul endroit à ajuster. */
export const champStyles = [
  "w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground",
  "placeholder:text-muted-foreground/70",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
].join(" ");

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} className={cn(champStyles, "h-11", className)} {...props} />
  ),
);
Input.displayName = "Input";

export { Input };
