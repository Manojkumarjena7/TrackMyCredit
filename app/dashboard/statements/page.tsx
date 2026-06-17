import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserStatements } from "@/lib/repositories/statements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatementList } from "@/components/statements/StatementList";
import { Upload } from "lucide-react";

export const metadata: Metadata = {
  title: "Statements",
};

// Revalidate on every visit so newly uploaded statements appear immediately
export const dynamic = "force-dynamic";

export default async function StatementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const statements = await getUserStatements(user.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Statements</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {statements.length > 0
              ? `${statements.length} statement${statements.length !== 1 ? "s" : ""} uploaded`
              : "No statements uploaded yet"}
          </p>
        </div>

        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Upload size={15} />
          Upload
        </Link>
      </div>

      {/* Statement list */}
      <Card>
        {statements.length > 0 && (
          <CardHeader>
            <CardTitle>All statements</CardTitle>
          </CardHeader>
        )}
        <CardContent className={statements.length > 0 ? "px-0 py-0 pb-2" : ""}>
          <StatementList statements={statements} />
        </CardContent>
      </Card>
    </div>
  );
}
