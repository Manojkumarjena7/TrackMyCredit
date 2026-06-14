import { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Credit Intelligence",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-950 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 14L9 4L15 14H3Z"
                  fill="white"
                  fillOpacity="0.9"
                />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">
              Credit Intelligence
            </span>
          </div>
        </div>

        <div>
          <blockquote className="text-2xl font-light text-white leading-relaxed mb-6">
            "Every rupee paid in interest, GST, and hidden charges — made
            visible."
          </blockquote>
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: "Total Spend", desc: "Across all cards" },
              { label: "Interest Paid", desc: "Real cost of credit" },
              { label: "Hidden Charges", desc: "Fees you didn't know" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <p className="text-white text-sm font-medium">{stat.label}</p>
                <p className="text-white/50 text-xs mt-1">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path d="M3 14L9 4L15 14H3Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="text-gray-900 font-semibold text-lg">
              Credit Intelligence
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Sign in to your account to continue
          </p>

          {/* Error / success messages */}
          {params.error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{params.error}</p>
            </div>
          )}
          {params.message && (
            <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{params.message}</p>
            </div>
          )}

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
