import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/Card";
import { Upload } from "lucide-react";

export const metadata: Metadata = {
  title: "Upload Statement",
};

export default function UploadPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Upload Statement</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload SBI or RBL credit card PDF statements
        </p>
      </div>

      <Card className="border-dashed border-gray-300">
        <CardContent className="py-16 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Upload size={22} className="text-gray-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Statement upload
          </h2>
          <p className="text-sm text-gray-500">
            PDF parser coming in Phase 3 & 4
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
