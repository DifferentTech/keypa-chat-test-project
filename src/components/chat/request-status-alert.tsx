"use client";

import { useState, useEffect, useCallback } from "react";

type RequestStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

type RequestStatusData = {
  id: string;
  status: RequestStatus;
  serviceType: string;
  issue: string;
  assignedProfessionalName: string | null;
  confirmedDate: string | null;
  confirmedTimeSlot: string | null;
  adminNotes: string | null;
};

type RequestStatusAlertProps = {
  requestId: string;
  serviceType: string;
  onStatusChange?: (status: RequestStatus, data: RequestStatusData) => void;
  pollInterval?: number;
};

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "Morning (9AM - 12PM)",
  afternoon: "Afternoon (12PM - 5PM)",
  evening: "Evening (5PM - 8PM)",
};

export function RequestStatusAlert({
  requestId,
  serviceType,
  onStatusChange,
  pollInterval = 5000,
}: RequestStatusAlertProps) {
  const [status, setStatus] = useState<RequestStatus>("pending");
  const [data, setData] = useState<RequestStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/requests/${requestId}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to fetch status");
        return;
      }

      const newData = result.data as RequestStatusData;
      setData(newData);

      if (newData.status !== status) {
        setStatus(newData.status);
        onStatusChange?.(newData.status, newData);
      }

      // Stop polling if request is no longer pending
      if (newData.status !== "pending") {
        setIsPolling(false);
      }
    } catch (err) {
      console.error("[RequestStatusAlert] Fetch error:", err);
      setError("Failed to check status");
    }
  }, [requestId, status, onStatusChange]);

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Set up polling
    if (isPolling) {
      const interval = setInterval(fetchStatus, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, isPolling, pollInterval]);

  if (error) {
    return (
      <div className="my-2 rounded-lg bg-red-50 border border-red-200 p-4">
        <div className="flex items-center gap-2 text-red-700">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      </div>
    );
  }

  // Pending status
  if (status === "pending") {
    return (
      <div className="my-2 rounded-lg bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-amber-800">Request Pending Approval</h4>
            <p className="mt-1 text-sm text-amber-700">
              Your {serviceType} service request (<code className="bg-amber-100 px-1 rounded">{requestId}</code>) is awaiting admin approval.
            </p>
            <p className="mt-2 text-xs text-amber-600">
              Checking for updates...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Approved status
  if (status === "approved" && data) {
    return (
      <div className="my-2 rounded-lg bg-green-50 border border-green-200 p-4">
        <div className="flex items-start gap-3">
          <svg className="h-6 w-6 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-medium text-green-800">Request Approved!</h4>
            <div className="mt-2 space-y-1 text-sm text-green-700">
              {data.assignedProfessionalName && (
                <p><span className="font-medium">Professional:</span> {data.assignedProfessionalName}</p>
              )}
              {data.confirmedDate && (
                <p><span className="font-medium">Date:</span> {data.confirmedDate}</p>
              )}
              {data.confirmedTimeSlot && (
                <p><span className="font-medium">Time:</span> {TIME_SLOT_LABELS[data.confirmedTimeSlot] || data.confirmedTimeSlot}</p>
              )}
              {data.adminNotes && (
                <p className="mt-2 italic text-green-600">Note: {data.adminNotes}</p>
              )}
            </div>
            <p className="mt-3 text-xs text-green-600">
              The professional will contact you to confirm the appointment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Rejected status
  if (status === "rejected" && data) {
    return (
      <div className="my-2 rounded-lg bg-red-50 border border-red-200 p-4">
        <div className="flex items-start gap-3">
          <svg className="h-6 w-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-medium text-red-800">Request Not Approved</h4>
            {data.adminNotes && (
              <p className="mt-2 text-sm text-red-700">
                <span className="font-medium">Reason:</span> {data.adminNotes}
              </p>
            )}
            <p className="mt-2 text-sm text-red-600">
              Please submit a new request or contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Other statuses (completed, cancelled)
  return (
    <div className="my-2 rounded-lg bg-gray-50 border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-700">
        <span className="text-sm">Request status: <span className="font-medium capitalize">{status}</span></span>
      </div>
    </div>
  );
}
