"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  Clock,
  Building,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadForm } from "@/components/protocol/upload-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import api, { ProtocolResponse, ProtocolUploadResponse } from "@/lib/api-client";
import { formatDate, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<ProtocolResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProtocols();
  }, []);

  async function loadProtocols() {
    try {
      const response = await api.listProtocols();
      setProtocols(response.protocols);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load protocols",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this protocol?")) return;

    try {
      await api.deleteProtocol(id);
      setProtocols((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: "Deleted",
        description: "Protocol deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete protocol",
        variant: "destructive",
      });
    }
  }

  function handleUploadSuccess(protocol: ProtocolUploadResponse) {
    setUploadOpen(false);
    loadProtocols();
    toast({
      title: "Success",
      description: "Protocol uploaded and parsed successfully",
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-36 bg-muted animate-pulse rounded" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger-children">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Protocols</h1>
          <p className="text-muted-foreground">
            Upload and manage clinical trial protocols
          </p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Upload Protocol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Protocol</DialogTitle>
              <DialogDescription>
                Upload a protocol PDF to extract data and generate documents
              </DialogDescription>
            </DialogHeader>
            <UploadForm onSuccess={handleUploadSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {protocols.length === 0 ? (
        <Card className="border-dashed">
          <EmptyState
            icon={FileText}
            title="No protocols yet"
            description="Upload your first protocol PDF to start generating regulatory documents"
            action={{
              label: "Upload Protocol",
              onClick: () => setUploadOpen(true),
            }}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {protocols.map((protocol, index) => (
            <Card
              key={protocol.id}
              className={cn(
                "group transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5",
                "animate-fade-in-up opacity-0"
              )}
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {protocol.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 flex-wrap">
                      {protocol.protocol_number && (
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                          {protocol.protocol_number}
                        </span>
                      )}
                      {protocol.sponsor && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {protocol.sponsor}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(protocol.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {formatDate(protocol.created_at)}
                  </div>
                  <Link href={`/protocols/${protocol.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1 group-hover:text-primary group-hover:bg-primary/5">
                      View Details
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
