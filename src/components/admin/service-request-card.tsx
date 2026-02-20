"use client";

import { useState } from "react";
import type { ServiceRequest } from "@/lib/db/service-requests";
import { professionals } from "@/lib/professionals";

type ServiceRequestCardProps = {
  request: ServiceRequest;
  onApprove: (
    id: string,
    data: {
      professionalId: string;
      confirmedDate: string;
      confirmedTimeSlot: string;
      adminNotes?: string;
    }
  ) => Promise<void>;
  onReject: (id: string, adminNotes?: string) => Promise<void>;
};

export function ServiceRequestCard({
  request,
  onApprove,
  onReject,
}: ServiceRequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [confirmedDate, setConfirmedDate] = useState(request.preferredDate || "");
  const [confirmedTimeSlot, setConfirmedTimeSlot] = useState<"morning" | "afternoon" | "evening">(
    (request.preferredTimeSlot as "morning" | "afternoon" | "evening") || "morning"
  );
  const [adminNotes, setAdminNotes] = useState("");

  const isPending = request.status === "pending";

  const availableProfessionals =
    professionals[request.serviceType as keyof typeof professionals] || professionals.general;

  const handleApprove = async () => {
    if (!selectedProfessional || !confirmedDate || !confirmedTimeSlot) {
      alert("Please select a professional, date, and time slot");
      return;
    }

    setIsProcessing(true);
    try {
      await onApprove(request.id, {
        professionalId: selectedProfessional,
        confirmedDate,
        confirmedTimeSlot,
        adminNotes: adminNotes || undefined,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(request.id, adminNotes || undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  const urgencyColors = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    emergency: "bg-red-100 text-red-700",
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  const timeSlotLabels: Record<string, string> = {
    morning: "Morning (9AM - 12PM)",
    afternoon: "Afternoon (12PM - 5PM)",
    evening: "Evening (5PM - 8PM)",
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{request.id}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[request.status]}`}
              >
                {request.status}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${urgencyColors[request.urgency]}`}
              >
                {request.urgency}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {request.serviceType} - {request.userName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {new Date(request.createdAt).toLocaleDateString()}
          </span>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t px-4 py-4">
          {/* Request details */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Customer</h4>
              <p className="text-sm text-gray-900">{request.userName}</p>
              <p className="text-sm text-gray-600">{request.userEmail}</p>
              <p className="text-sm text-gray-600">{request.userPhone}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">Property</h4>
              <p className="text-sm text-gray-900">{request.propertyAddress}</p>
              <p className="text-sm text-gray-600">ID: {request.propertyId}</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700">Issue Description</h4>
            <p className="mt-1 rounded bg-gray-50 p-3 text-sm text-gray-900">{request.issue}</p>
          </div>

          {request.preferredDate && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700">Preferred Schedule</h4>
              <p className="text-sm text-gray-900">
                {request.preferredDate} - {timeSlotLabels[request.preferredTimeSlot || "morning"]}
              </p>
            </div>
          )}

          {/* Approval result for processed requests */}
          {!isPending && (
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <h4 className="text-sm font-medium text-gray-700">Processing Details</h4>
              {request.status === "approved" && (
                <>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Professional:</span>{" "}
                    {request.assignedProfessionalName}
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Scheduled:</span> {request.confirmedDate} -{" "}
                    {timeSlotLabels[request.confirmedTimeSlot || "morning"]}
                  </p>
                </>
              )}
              {request.adminNotes && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {request.adminNotes}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Processed by {request.processedBy} on{" "}
                {request.processedAt && new Date(request.processedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Approval form for pending requests */}
          {isPending && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assign Professional
                </label>
                <select
                  value={selectedProfessional}
                  onChange={(e) => setSelectedProfessional(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a professional...</option>
                  {availableProfessionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.rating} stars ({p.reviews} reviews) - {p.priceRange}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirmed Date</label>
                  <input
                    type="date"
                    value={confirmedDate}
                    onChange={(e) => setConfirmedDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                  <select
                    value={confirmedTimeSlot}
                    onChange={(e) => setConfirmedTimeSlot(e.target.value as "morning" | "afternoon" | "evening")}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="morning">Morning (9AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 5PM)</option>
                    <option value="evening">Evening (5PM - 8PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes..."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Reject"}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing || !selectedProfessional || !confirmedDate}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Approve"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
