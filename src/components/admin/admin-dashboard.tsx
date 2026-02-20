"use client";

import { useState, useEffect, useCallback } from "react";
import { ServiceRequestCard } from "./service-request-card";
import type { ServiceRequest, RequestStatus } from "@/lib/db/service-requests";

type RequestCounts = Record<RequestStatus, number>;

export function AdminDashboard() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [counts, setCounts] = useState<RequestCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    cancelled: 0,
  });
  const [filter, setFilter] = useState<"all" | "pending" | "processed">("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/requests");
      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      setRequests(data.data || []);
      setCounts(data.counts || {
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        cancelled: 0,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleApprove = async (
    id: string,
    data: {
      professionalId: string;
      confirmedDate: string;
      confirmedTimeSlot: string;
      adminNotes?: string;
    }
  ) => {
    try {
      const response = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          processedBy: "admin",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to approve request");
      }

      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve request");
    }
  };

  const handleReject = async (id: string, adminNotes?: string) => {
    try {
      const response = await fetch(`/api/admin/requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNotes,
          processedBy: "admin",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to reject request");
      }

      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "pending") return r.status === "pending";
    if (filter === "processed") return r.status !== "pending";
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <span>Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Pending"
          value={counts.pending}
          variant={counts.pending > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Approved"
          value={counts.approved}
          variant="success"
        />
        <StatCard
          label="Rejected"
          value={counts.rejected}
          variant="danger"
        />
        <StatCard
          label="Total"
          value={Object.values(counts).reduce((a, b) => a + b, 0)}
          variant="default"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b">
        <FilterTab
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
          label="Pending"
          count={counts.pending}
        />
        <FilterTab
          active={filter === "processed"}
          onClick={() => setFilter("processed")}
          label="Processed"
        />
        <FilterTab
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />
      </div>

      {/* Request list */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 p-3">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {filter === "pending" ? "No pending requests" : "No requests found"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "pending"
              ? "All caught up! Check back later for new requests."
              : "Requests will appear here when users submit them."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <ServiceRequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "warning" | "success" | "danger";
}) {
  const variantStyles = {
    default: "bg-white",
    warning: "bg-orange-50 border-orange-200",
    success: "bg-green-50 border-green-200",
    danger: "bg-red-50 border-red-200",
  };

  const valueStyles = {
    default: "text-gray-900",
    warning: "text-orange-600",
    success: "text-green-600",
    danger: "text-red-600",
  };

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${variantStyles[variant]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-semibold ${valueStyles[variant]}`}>{value}</p>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-b-2 border-blue-600 text-blue-600"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
          {count}
        </span>
      )}
    </button>
  );
}
