"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { FileText, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ExistingProtocol {
  id: string;
  title: string;
  protocol_number?: string;
  sponsor?: string;
  uploaded_at: string;
}

export interface DuplicateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProtocol: ExistingProtocol;
  onUseExisting: () => void;
  onUploadAnyway: () => void;
}

export function DuplicateModal({
  open,
  onOpenChange,
  existingProtocol,
  onUseExisting,
  onUploadAnyway,
}: DuplicateModalProps) {
  const uploadedDate = React.useMemo(() => {
    if (!existingProtocol.uploaded_at) return "Unknown date";
    try {
      return formatDistanceToNow(new Date(existingProtocol.uploaded_at), {
        addSuffix: true,
      });
    } catch {
      return new Date(existingProtocol.uploaded_at).toLocaleDateString();
    }
  }, [existingProtocol.uploaded_at]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-slate-700/50 text-slate-50 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none" />

        {/* Accent gradient glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-coral-500/10 rounded-full blur-3xl pointer-events-none" />

        <DialogHeader className="relative space-y-4 pb-4 border-b border-slate-700/50">
          {/* Icon with backdrop */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-400" strokeWidth={2} />
              </div>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold tracking-tight text-slate-50">
                Protocol Already Exists
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-400 mt-0.5">
                This file has been uploaded before
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Protocol details card */}
        <div className="relative py-6 space-y-4">
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 space-y-3.5 hover:border-slate-600/50 transition-colors duration-200">
            {/* File icon header */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-teal-400" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-slate-50 leading-snug line-clamp-2">
                  {existingProtocol.title}
                </h3>
                {existingProtocol.protocol_number && (
                  <p className="text-sm font-mono text-teal-400 mt-1">
                    {existingProtocol.protocol_number}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/30">
              {existingProtocol.sponsor && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Sponsor
                  </p>
                  <p className="text-sm text-slate-300">{existingProtocol.sponsor}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Uploaded
                </p>
                <p className="text-sm text-slate-300">{uploadedDate}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed px-1">
            You can use the existing protocol or upload this file as a new version.
          </p>
        </div>

        <DialogFooter className="relative gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={onUploadAnyway}
            className="flex-1 sm:flex-1 border-coral-500/30 bg-coral-500/5 text-coral-400 hover:bg-coral-500/10 hover:border-coral-500/50 hover:text-coral-300 transition-all duration-200"
          >
            Upload Anyway
          </Button>
          <Button
            onClick={onUseExisting}
            className="flex-1 sm:flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white border-0 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all duration-200"
          >
            Use Existing Protocol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
