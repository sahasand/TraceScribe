"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./dialog";
import { Button } from "./button";
import { LanguageBadge } from "./language-badge";

interface TranslateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTranslate: (language: string) => Promise<void>;
  isLoading?: boolean;
  sourceLanguage?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
];

export function TranslateDialog({
  isOpen,
  onOpenChange,
  onTranslate,
  isLoading = false,
  sourceLanguage = "en",
}: TranslateDialogProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (selectedLanguage) {
      await onTranslate(selectedLanguage);
      setSelectedLanguage(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      onOpenChange(open);
      if (!open) {
        setSelectedLanguage(null);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Translate Document
          </DialogTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Select a language to translate this document from{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              English
            </span>
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {SUPPORTED_LANGUAGES.map((lang, index) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              disabled={isLoading}
              className="group relative p-3 rounded-lg border-2 transition-all duration-200"
              style={{
                borderColor:
                  selectedLanguage === lang.code
                    ? "rgb(13, 148, 136)"
                    : "rgb(226, 232, 240)",
                backgroundColor:
                  selectedLanguage === lang.code
                    ? "rgb(240, 253, 250)"
                    : "transparent",
              }}
              onMouseEnter={(e) => {
                if (selectedLanguage !== lang.code) {
                  e.currentTarget.style.borderColor = "rgb(148, 163, 184)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLanguage !== lang.code) {
                  e.currentTarget.style.borderColor = "rgb(226, 232, 240)";
                }
              }}
            >
              <div className="flex flex-col items-start gap-1.5">
                <LanguageBadge
                  code={lang.code}
                  variant={
                    selectedLanguage === lang.code ? "glow" : "default"
                  }
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 text-left">
                  {lang.name}
                </span>
              </div>

              {selectedLanguage === lang.code && (
                <div className="absolute inset-0 rounded-lg bg-teal-100/10 dark:bg-teal-900/10 animate-pulse pointer-events-none" />
              )}
            </button>
          ))}
        </div>

        <DialogFooter className="flex gap-2 justify-end pt-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleTranslate}
            disabled={!selectedLanguage || isLoading}
            className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600"
          >
            {isLoading ? "Translating..." : "Translate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
