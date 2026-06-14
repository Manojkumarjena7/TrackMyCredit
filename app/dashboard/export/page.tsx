import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/Card";
import { Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Export",
};

export default function ExportPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Export</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Download your data as Excel, CSV, or PDF
        </p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Download size={22} className="text-gray-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Export center
          </h2>
          <p className="text-sm text-gray-500">Coming in Phase 10</p>
        </CardContent>
      </Card>
    </div>
  );
}
