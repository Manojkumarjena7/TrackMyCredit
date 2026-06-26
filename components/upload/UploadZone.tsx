"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  CloudUpload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CardSelector } from "@/components/upload/CardSelector";
import { StatementDatePicker } from "@/components/upload/StatementDatePicker";
import { validatePdfFile } from "@/lib/validation/upload";
import { uploadStatement } from "@/actions/upload";
import type { Card, BankName } from "@/types";

interface UploadZoneProps {
  existingCards: Card[];
}

interface NewCardData {
  bankName: BankName | null;
  cardName: string;
  cardLastFour: string;
}

type UploadState =
  | { phase: "idle" }
  | { phase: "file_selected"; file: File }
  | { phase: "uploading" }
  | { phase: "success"; statementId: string }
  | { phase: "error"; message: string };

export function UploadZone({ existingCards }: UploadZoneProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ phase: "idle" });
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    existingCards[0]?.id ?? null
  );
  const [newCardData, setNewCardData] = useState<NewCardData>({
    bankName: "SBI",
    cardName: "",
    cardLastFour: "",
  });

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [isPending, startTransition] = useTransition();

  // ── File handling ──────────────────────────────────────────────────────

  function processFile(file: File) {
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      setUploadState({ phase: "error", message: validation.error! });
      return;
    }
    setUploadState({ phase: "file_selected", file });
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
  }

  // ── Drag and drop ──────────────────────────────────────────────────────

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear drag state when leaving the outermost drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  // ── Clear selection ────────────────────────────────────────────────────

  function clearFile() {
    setUploadState({ phase: "idle" });
  }

  // ── Submit ─────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (uploadState.phase !== "file_selected") return;

    // Client-side card validation
    if (!selectedCardId && !newCardData.cardName.trim()) {
      setUploadState({
        phase: "error",
        message: "Please select an existing card or enter a card name for the new card.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadState.file);
    formData.append("month", String(month));
    formData.append("year", String(year));

    if (selectedCardId) {
      formData.append("card_id", selectedCardId);
    } else {
      formData.append("bank_name", newCardData.bankName ?? "SBI");
      formData.append("card_name", newCardData.cardName.trim());
      if (newCardData.cardLastFour) {
        formData.append("card_last_four", newCardData.cardLastFour);
      }
    }

    setUploadState({ phase: "uploading" });

    startTransition(async () => {
  const result = await uploadStatement(formData);

  console.log("UPLOAD RESULT:", result);

  if (result.success && result.statementId) {
    console.log("CALLING PROCESS API:", result.statementId);

    try {
      const response = await fetch(
        `/api/process/${result.statementId}`,
        {
          method: "POST",
        }
      );

      console.log("PROCESS STATUS:", response.status);

      const data = await response.json();
      console.log("PROCESS RESPONSE:", data);
    } catch (err) {
      console.error("Processor trigger failed:", err);
    }

    setUploadState({
      phase: "success",
      statementId: result.statementId,
    });

        setTimeout(() => {
      router.push("/dashboard/statements");
      router.refresh();
    }, 1800);
  } else {
    setUploadState({
      phase: "error",
      message: result.error ?? "Upload failed. Please try again.",
    });
  }
});
}

  // ── Render ─────────────────────────────────────────────────────────────

  if (uploadState.phase === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          Statement uploaded
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Your statement has been saved. Redirecting to statements list…
        </p>
      </div>
    );
  }

  const isFileSelected = uploadState.phase === "file_selected";
  const isUploading = uploadState.phase === "uploading";
  const hasError = uploadState.phase === "error";

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {uploadState.phase === "error" && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle
            size={17}
            className="text-red-500 flex-shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700">Upload failed</p>
            <p className="text-sm text-red-600 mt-0.5">{uploadState.message}</p>
          </div>
          <button
            onClick={() => setUploadState({ phase: "idle" })}
            className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isFileSelected && fileInputRef.current?.click()}
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-150
          ${isFileSelected || isUploading
            ? "border-brand-300 bg-brand-50/30 cursor-default"
            : isDragging
            ? "border-brand-500 bg-brand-50 cursor-copy scale-[1.01]"
            : "border-gray-300 bg-white hover:border-brand-400 hover:bg-gray-50 cursor-pointer"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileInput}
          className="sr-only"
          aria-label="Select PDF statement"
        />

        {/* Idle / drag state */}
        {!isFileSelected && !isUploading && (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                isDragging ? "bg-brand-200" : "bg-gray-100"
              }`}
            >
              <CloudUpload
                size={26}
                className={isDragging ? "text-brand-700" : "text-gray-400"}
              />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {isDragging ? "Drop the PDF here" : "Drag and drop your PDF"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or{" "}
              <span className="text-brand-600 font-medium">browse files</span>
            </p>
            <p className="text-xs text-gray-400">
              PDF only — maximum 20 MB
            </p>
          </div>
        )}

        {/* File selected state */}
        {isFileSelected && (
          <div className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {uploadState.file.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(uploadState.file.size / (1024 * 1024)).toFixed(2)} MB · PDF
              </p>
            </div>
            <button
              onClick={clearFile}
              className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 p-1 rounded-md hover:bg-gray-100"
              aria-label="Remove file"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Uploading overlay */}
        {isUploading && (
          <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
            <svg
              className="animate-spin h-8 w-8 text-brand-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-20"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              Uploading statement…
            </p>
            <p className="text-xs text-gray-400">This may take a moment</p>
          </div>
        )}
      </div>

      {/* Card selector */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Card</h3>
        <CardSelector
          existingCards={existingCards}
          onCardChange={setSelectedCardId}
          onNewCardChange={(data) => {
            setNewCardData(data);
            setSelectedCardId(null);
          }}
        />
      </div>

      {/* Statement period */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Statement period
        </h3>
        <StatementDatePicker
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
      </div>

      {/* Submit */}
      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full"
        loading={isUploading || isPending}
        disabled={!isFileSelected || isUploading || isPending}
        onClick={handleSubmit}
      >
        <Upload size={16} />
        {isUploading ? "Uploading…" : "Upload statement"}
      </Button>

      {/* Info footer */}
      <p className="text-xs text-gray-400 text-center">
        Statements are stored securely. PDF parsing runs automatically in the background.
      </p>
    </div>
  );
}
