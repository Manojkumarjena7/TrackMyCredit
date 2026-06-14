import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/Card";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Financial Health",
};

export default function HealthPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Financial Health</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Lifetime statistics — total interest, GST, and charges paid to banks
        </p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Heart size={22} className="text-pink-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Financial health dashboard
          </h2>
          <p className="text-sm text-gray-500">
            Lifetime metrics coming in Phase 8
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
