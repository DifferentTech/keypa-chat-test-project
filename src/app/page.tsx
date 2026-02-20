"use client";

import { UserChatWithContext } from "@/components/chat/copilot-chat";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Home Maintenance Assistant
            </h1>
            <p className="text-sm text-gray-500">
              Get help with repairs, maintenance tips, and contractor scheduling
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Admin Portal
          </a>
        </div>
      </header>
      <div className="flex-1 bg-gray-50">
        <div className="mx-auto h-[calc(100vh-80px)] max-w-4xl p-4">
          <UserChatWithContext />
        </div>
      </div>
    </main>
  );
}
