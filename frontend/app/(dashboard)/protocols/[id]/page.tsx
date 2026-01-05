"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExtractionResults } from "@/components/protocol/extraction-results";
import api, { ProtocolResponse, ExtractedProtocol } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

const documentTypes = [
  {
    id: "icf",
    name: "Informed Consent Form",
    description: "FDA-compliant ICF with plain language",
  },
  {
    id: "dmp",
    name: "Data Management Plan",
    description: "Complete DMP with 4-level numbering",
  },
  {
    id: "sap",
    name: "Statistical Analysis Plan",
    description: "SAP with verbatim endpoints",
  },
] as const;

export default function ProtocolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [protocol, setProtocol] = useState<ProtocolResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadProtocol();
  }, [params.id]);

  async function loadProtocol() {
    try {
      const data = await api.getProtocol(params.id as string);
      setProtocol(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load protocol",
        variant: "destructive",
      });
      router.push("/protocols");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(type: "icf" | "dmp" | "sap") {
    if (!protocol) return;

    setGenerating(type);

    try {
      await api.generateDocument(protocol.id, type);
      toast({
        title: "Document Generated",
        description: `${type.toUpperCase()} has been generated successfully`,
      });
      router.push("/documents");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to generate document",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!protocol) {
    return null;
  }

  const extractedData = protocol.extracted_data as ExtractedProtocol | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/protocols">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{protocol.title}</h1>
          <p className="text-muted-foreground">
            {protocol.protocol_number}
            {protocol.sponsor && ` • ${protocol.sponsor}`}
          </p>
        </div>
      </div>

      {/* Generate Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Documents</CardTitle>
          <CardDescription>
            Create regulatory documents from extracted protocol data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {documentTypes.map((doc) => (
              <Card key={doc.id} className="relative">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <FileText className="h-10 w-10 text-primary mb-3" />
                    <h3 className="font-semibold">{doc.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {doc.description}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => handleGenerate(doc.id)}
                      disabled={generating !== null}
                    >
                      {generating === doc.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extracted Data */}
      {extractedData && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Extracted Protocol Data</h2>
          <ExtractionResults
            data={extractedData}
            confidenceFlags={extractedData.confidence_flags || []}
          />
        </div>
      )}
    </div>
  );
}
