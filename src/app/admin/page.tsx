import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata = {
  title: "Admin Portal - Home Maintenance",
  description: "Manage pending approval requests",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
              <p className="text-sm text-gray-500">Manage pending approval requests</p>
            </div>
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← Back to Chat
            </a>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl p-6">
        <AdminDashboard />
      </div>
    </main>
  );
}
