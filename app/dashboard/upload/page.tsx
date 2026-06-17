import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCards } from "@/lib/repositories/cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UploadZone } from "@/components/upload/UploadZone";
import { Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Upload Statement",
};

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cards = await getUserCards(user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Upload Statement</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload SBI or RBL credit card PDF statements
        </p>
      </div>

      {/* Supported formats notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <span className="font-medium">Supported banks:</span> SBI Credit Card,
          RBL Credit Card. PDF parsing runs automatically after upload — results
          appear in Statements once processing is complete.
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statement file</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <UploadZone existingCards={cards} />
        </CardContent>
      </Card>
    </div>
  );
}
