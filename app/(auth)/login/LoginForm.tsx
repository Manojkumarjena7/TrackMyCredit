"use client";

import { useState, useTransition } from "react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "@/actions/auth";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  function handleEmailSubmit(formData: FormData) {
    startTransition(async () => {
      if (mode === "signin") {
        await signInWithEmail(formData);
      } else {
        await signUpWithEmail(formData);
      }
    });
  }

  function handleGoogle() {
    startGoogleTransition(async () => {
      await signInWithGoogle();
    });
  }

  return (
    <div className="space-y-5">
      {/* Google OAuth */}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        loading={isGooglePending}
        onClick={handleGoogle}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-gray-50 px-3 text-gray-400 font-medium uppercase tracking-wider">
            or
          </span>
        </div>
      </div>

      {/* Email/password form */}
      <form action={handleEmailSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Rajesh Kumar"
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••••"
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isPending}
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      {/* Toggle sign in / sign up */}
      <p className="text-center text-sm text-gray-500">
        {mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
