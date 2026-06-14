import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/Card";
import { TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Debt Growth",
};

export default function DebtPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Debt Growth</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Understand how principal, interest, and fees compound over time
        </p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={22} className="text-red-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Debt growth analysis
          </h2>
          <p className="text-sm text-gray-500">Coming in Phase 9</p>
        </CardContent>
      </Card>
    </div>
  );
}
