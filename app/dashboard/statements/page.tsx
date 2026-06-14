import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/Card";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Statements",
};

export default function StatementsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Statements</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          All uploaded credit card statements
        </p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText size={22} className="text-gray-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            No statements yet
          </h2>
          <p className="text-sm text-gray-500">
            Upload a statement to see it listed here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
