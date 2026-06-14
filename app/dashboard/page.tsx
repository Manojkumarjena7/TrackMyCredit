import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  CreditCard,
  FileText,
  TrendingUp,
  Upload,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Count cards and statements for the authenticated user
  const [cardsResult, statementsResult] = await Promise.all([
    supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .is("deleted_at", null),
    supabase
      .from("statements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .is("deleted_at", null),
  ]);

  const cardCount = cardsResult.count ?? 0;
  const statementCount = statementsResult.count ?? 0;
  const hasData = statementCount > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your credit card intelligence dashboard
        </p>
      </div>

      {/* Empty state — no statements uploaded yet */}
      {!hasData && (
        <Card className="border-dashed border-brand-200 bg-brand-50/30">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Upload size={22} className="text-brand-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              No statements yet
            </h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
              Upload your first credit card statement to start seeing your
              spending, interest, and hidden charges.
            </p>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Upload statement
              <ArrowRight size={15} />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Cards tracked"
          value={cardCount.toString()}
          icon={CreditCard}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <SummaryCard
          title="Statements"
          value={statementCount.toString()}
          icon={FileText}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <SummaryCard
          title="Total spend"
          value={hasData ? "View analytics" : "—"}
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          href={hasData ? "/dashboard/analytics" : undefined}
        />
        <SummaryCard
          title="Hidden charges"
          value={hasData ? "View analytics" : "—"}
          icon={TrendingUp}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          href={hasData ? "/dashboard/analytics/hidden-charges" : undefined}
        />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Upload statement",
                desc: "SBI or RBL credit card PDF",
                href: "/dashboard/upload",
                icon: Upload,
              },
              {
                label: "View analytics",
                desc: "Monthly, yearly, or custom range",
                href: "/dashboard/analytics",
                icon: TrendingUp,
              },
              {
                label: "Export data",
                desc: "Excel, CSV, or PDF report",
                href: "/dashboard/export",
                icon: FileText,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
                >
                  <div className="w-9 h-9 bg-gray-100 group-hover:bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon
                      size={17}
                      className="text-gray-500 group-hover:text-brand-600 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  href,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  href?: string;
}) {
  const content = (
    <Card
      className={href ? "hover:shadow-card-hover transition-shadow" : ""}
    >
      <CardContent className="py-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}>
            <Icon size={17} className={iconColor} />
          </div>
        </div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{title}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
