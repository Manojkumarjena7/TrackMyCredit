import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Hidden Charges",
};

export default function HiddenChargesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hidden Charges</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Finance charges, GST, convenience fees, and more
        </p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-amber-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Hidden charges analysis
          </h2>
          <p className="text-sm text-gray-500">
            Coming in Phase 7 — requires statements to be uploaded first
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
