import { cn } from "@/lib/utils";

interface LanguageBadgeProps {
  code: string; // ISO 639-1
  variant?: "default" | "glow";
  className?: string;
}

export function LanguageBadge({
  code,
  variant = "default",
  className
}: LanguageBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md px-2 py-0.5",
        "font-mono text-[10px] font-bold uppercase tracking-wider",
        "transition-all duration-200",
        {
          // Default variant - neutral
          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400":
            variant === "default",

          // Glow variant - teal accent for translated docs
          "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800":
            variant === "glow",
          "shadow-[0_0_8px_rgba(13,148,136,0.3)] dark:shadow-[0_0_8px_rgba(45,212,191,0.2)]":
            variant === "glow",
        },
        className
      )}
      aria-label={`${getLanguageName(code)} translation`}
    >
      {code.toUpperCase()}
    </span>
  );
}

function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    pt: "Portuguese",
    it: "Italian",
    nl: "Dutch",
    pl: "Polish",
  };
  return names[code] || code.toUpperCase();
}
