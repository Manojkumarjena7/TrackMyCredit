"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Download, ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/statements/StatusBadge";
import { getStatementDownloadUrl } from "@/actions/statements";
import { getMonthName, formatDate } from "@/lib/utils";
import type { StatementWithCard } from "@/lib/repositories/statements";

interface StatementListProps {
  statements: StatementWithCard[];
}

export function StatementList({ statements }: StatementListProps) {
  if (statements.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <FileText size={22} className="text-gray-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          No statements yet
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Upload your first credit card statement to get started.
        </p>
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Upload statement
          <ArrowUpRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Card
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Statement Period
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {statements.map((s) => (
            <StatementRow key={s.id} statement={s} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatementRow({ statement }: { statement: StatementWithCard }) {
  const [isDownloading, startDownload] = useTransition();
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloadError(null);
    startDownload(async () => {
      const url = await getStatementDownloadUrl(statement.id);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setDownloadError("Download link unavailable.");
      }
    });
  }

  const card = statement.cards;
  const cardLabel = card.card_last_four
    ? `${card.bank_name} ••••${card.card_last_four}`
    : `${card.bank_name} ${card.card_name}`;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Card */}
      <td className="py-3.5 px-4">
        <div>
          <p className="font-medium text-gray-900">{cardLabel}</p>
          <p className="text-xs text-gray-400 mt-0.5">{card.card_name}</p>
        </div>
      </td>

      {/* Statement period */}
      <td className="py-3.5 px-4">
        <span className="font-medium text-gray-900">
          {getMonthName(statement.statement_month)} {statement.statement_year}
        </span>
      </td>

      {/* Uploaded date */}
      <td className="py-3.5 px-4 text-gray-500">
        {formatDate(statement.uploaded_at)}
      </td>

      {/* Status */}
      <td className="py-3.5 px-4">
        <StatusBadge status={statement.processing_status} />
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {downloadError && (
            <span className="text-xs text-red-500">{downloadError}</span>
          )}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download PDF"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-md hover:bg-brand-50"
          >
            {isDownloading ? (
              <svg
                className="animate-spin h-3.5 w-3.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
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
            ) : (
              <Download size={13} />
            )}
            Download
          </button>
        </div>
      </td>
    </tr>
  );
}
