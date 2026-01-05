"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { DuplicateModal, ExistingProtocol } from "@/components/protocols/duplicate-modal";
import api, { ProtocolUploadResponse } from "@/lib/api-client";
import { formatFileSize } from "@/lib/utils";

interface UploadFormProps {
  onSuccess: (protocol: ProtocolUploadResponse) => void;
}

type UploadStatus = "idle" | "uploading" | "parsing" | "success" | "error";

export function UploadForm({ onSuccess }: UploadFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [existingProtocol, setExistingProtocol] = useState<ExistingProtocol | null>(null);
  const [forceUpload, setForceUpload] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setError("Please upload a PDF file");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setStatus("idle");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);
    setError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 40) {
            clearInterval(progressInterval);
            return 40;
          }
          return prev + 5;
        });
      }, 100);

      setStatus("parsing");
      setProgress(50);

      // Upload and parse
      const result = await api.uploadProtocol(file);

      clearInterval(progressInterval);

      // Check if duplicate detected
      if ((result as any).duplicate === true) {
        setProgress(0);
        setStatus("idle");
        setExistingProtocol((result as any).existing_protocol);
        setDuplicateModalOpen(true);
        return;
      }

      setProgress(100);
      setStatus("success");

      // Call success callback
      onSuccess(result);
    } catch (err: any) {
      setStatus("error");
      setError(err.detail || "Failed to upload protocol");
    }
  };

  const handleUseExisting = () => {
    if (existingProtocol) {
      setDuplicateModalOpen(false);
      router.push(`/protocols/${existingProtocol.id}`);
    }
  };

  const handleUploadAnyway = async () => {
    if (!file) return;

    setDuplicateModalOpen(false);
    setStatus("uploading");
    setProgress(0);
    setError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 40) {
            clearInterval(progressInterval);
            return 40;
          }
          return prev + 5;
        });
      }, 100);

      setStatus("parsing");
      setProgress(50);

      // Upload with force=true to bypass duplicate detection
      const result = await api.uploadProtocol(file, { force: true });

      clearInterval(progressInterval);

      // Success - force upload should never return duplicate response
      setProgress(100);
      setStatus("success");
      onSuccess(result);
    } catch (err: any) {
      setStatus("error");
      setError(err.detail || "Failed to upload protocol");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {!file && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-1">
            {isDragActive ? "Drop your protocol here" : "Upload Protocol PDF"}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag and drop or click to select a file
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            PDF files up to 50MB
          </p>
        </div>
      )}

      {/* Selected File */}
      {file && status !== "success" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {status === "idle" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Progress */}
            {(status === "uploading" || status === "parsing") && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {status === "uploading"
                    ? "Uploading..."
                    : "Parsing protocol with AI..."}
                </p>
              </div>
            )}

            {/* Upload Button */}
            {status === "idle" && (
              <Button className="w-full mt-4" onClick={handleUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload and Parse
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {status === "success" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  Protocol uploaded successfully!
                </p>
                <p className="text-sm text-green-700">
                  AI has extracted the protocol data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Upload failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRemoveFile}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Detection Modal */}
      {existingProtocol && (
        <DuplicateModal
          open={duplicateModalOpen}
          onOpenChange={setDuplicateModalOpen}
          existingProtocol={existingProtocol}
          onUseExisting={handleUseExisting}
          onUploadAnyway={handleUploadAnyway}
        />
      )}
    </div>
  );
}
