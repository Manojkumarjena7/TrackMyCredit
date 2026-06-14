"use client";

import { useTransition } from "react";
import { signOut } from "@/actions/auth";
import { LogOut, User } from "lucide-react";

interface TopBarProps {
  displayName: string;
  email: string;
}

export function TopBar({ displayName, email }: TopBarProps) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div />

      <div className="flex items-center gap-3">
        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
            <User size={15} className="text-brand-700" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">
              {displayName}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-none">{email}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={isPending}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1.5 rounded-lg hover:bg-gray-50"
          title="Sign out"
        >
          {isPending ? (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <LogOut size={16} />
          )}
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
