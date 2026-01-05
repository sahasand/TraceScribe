"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Download, Clock, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { TranslateButton } from "@/components/ui/translate-button";
import { TranslateDialog } from "@/components/ui/translate-dialog";
import { LanguageBadge } from "@/components/ui/language-badge";
import api, { DocumentResponse } from "@/lib/api-client";
import { formatDate, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const response = await api.listDocuments();
      setDocuments(response.documents);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(doc: DocumentResponse) {
    try {
      const blob = await api.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.document_type}_v${doc.version}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Downloaded",
        description: `${doc.document_type.toUpperCase()} downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  }

  async function handleTranslate(targetLanguage: string) {
    if (!selectedDocumentId) return;

    setTranslating(true);
    try {
      const result = await api.translateDocument(selectedDocumentId, targetLanguage);
      toast({
        title: "Translation Started",
        description: `Document is being translated to ${targetLanguage.toUpperCase()}`,
      });
      setTranslateOpen(false);
      setSelectedDocumentId(null);
      await loadDocuments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to translate document",
        variant: "destructive",
      });
    } finally {
      setTranslating(false);
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      icf: "Informed Consent Form",
      dmp: "Data Management Plan",
      sap: "Statistical Analysis Plan",
    };
    return labels[type] || type.toUpperCase();
  };

  const getDocumentTypeIcon = (type: string) => {
    return FileText;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger-children">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          View and download generated documents
        </p>
      </div>

      {documents.length === 0 ? (
        <Card className="border-dashed">
          <EmptyState
            icon={FileCheck}
            title="No documents yet"
            description="Upload a protocol and generate documents to get started"
            action={{
              label: "Go to Protocols",
              onClick: () => window.location.href = "/protocols",
            }}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc, index) => (
            <Card
              key={doc.id}
              className={cn(
                "group transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5",
                "animate-fade-in-up opacity-0"
              )}
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getDocumentTypeLabel(doc.document_type)}
                        {doc.language && doc.language !== "en" && (
                          <LanguageBadge code={doc.language} variant="glow" />
                        )}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        Version {doc.version}
                      </CardDescription>
                    </div>
                  </div>
                  <StatusIndicator status={doc.status as any} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {formatDate(doc.created_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.document_type === "icf" && doc.language === "en" && (
                      <TranslateButton
                        onClick={() => {
                          setSelectedDocumentId(doc.id);
                          setTranslateOpen(true);
                        }}
                        isLoading={translating && selectedDocumentId === doc.id}
                        disabled={translating}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 group-hover:border-primary group-hover:text-primary transition-colors"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TranslateDialog
        isOpen={translateOpen}
        onOpenChange={setTranslateOpen}
        onTranslate={handleTranslate}
        isLoading={translating}
      />
    </div>
  );
}
