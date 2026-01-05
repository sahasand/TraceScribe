import { Languages } from "lucide-react";
import { Button } from "./button";

interface TranslateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function TranslateButton({
  onClick,
  isLoading = false,
  disabled = false,
}: TranslateButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="relative group"
      title="Translate to other languages"
    >
      <Languages className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
      <span className="ml-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
        {isLoading ? "Translating..." : "Translate"}
      </span>
    </Button>
  );
}
