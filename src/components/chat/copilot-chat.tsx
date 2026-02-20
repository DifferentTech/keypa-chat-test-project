"use client";

import { useMemo, useState } from "react";
import { CopilotKit, useCopilotAction, useCopilotChat } from "@copilotkit/react-core";
import { RequestStatusAlert } from "./request-status-alert";
import { CopilotChat } from "@copilotkit/react-ui";
import { TextMessage, MessageRole } from "@copilotkit/runtime-client-gql";
import "@copilotkit/react-ui/styles.css";

// Conversation starter topics
const conversationStarters = [
  {
    icon: "🔧",
    title: "Plumbing Issue",
    description: "Leaks, clogs, or water problems",
    message: "I have a plumbing issue at my home. Can you help me?",
  },
  {
    icon: "⚡",
    title: "Electrical Problem",
    description: "Outlets, switches, or wiring",
    message: "I'm experiencing an electrical problem. What should I do?",
  },
  {
    icon: "❄️",
    title: "HVAC & Climate",
    description: "Heating, cooling, or ventilation",
    message: "My HVAC system isn't working properly. Can you help diagnose the issue?",
  },
  {
    icon: "🏠",
    title: "General Maintenance",
    description: "Repairs, upkeep, or improvements",
    message: "I need help with general home maintenance. What services do you offer?",
  },
  {
    icon: "💰",
    title: "Get Cost Estimate",
    description: "Pricing for repairs or services",
    message: "Can you give me a cost estimate for home repairs?",
  },
  {
    icon: "📅",
    title: "Schedule Service",
    description: "Book a professional visit",
    message: "I'd like to schedule a professional to come to my home.",
  },
];

// Conversation starters component
function ConversationStarters({ onSelect }: { onSelect: (message: string) => void }) {
  return (
    <div className="p-4">
      <p className="mb-3 text-sm text-gray-500">Choose a topic to get started:</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {conversationStarters.map((starter) => (
          <button
            key={starter.title}
            onClick={() => onSelect(starter.message)}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="text-2xl">{starter.icon}</span>
            <div>
              <p className="font-medium text-gray-900">{starter.title}</p>
              <p className="text-xs text-gray-500">{starter.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Inner chat component that can use CopilotKit hooks
function ChatWithStarters({ userName }: { userName: string }) {
  const [showStarters, setShowStarters] = useState(true);
  const { appendMessage } = useCopilotChat();

  const handleStarterSelect = (message: string) => {
    setShowStarters(false);
    appendMessage(
      new TextMessage({
        role: MessageRole.User,
        content: message,
      })
    );
  };

  return (
    <div className="flex h-full flex-col">
      {showStarters && <ConversationStarters onSelect={handleStarterSelect} />}
      <CopilotChat
        className="flex-1"
        onSubmitMessage={() => setShowStarters(false)}
        labels={{
          initial: `Hi ${userName.split(" ")[0]}! I'm your home maintenance assistant. How can I help you today?`,
          title: "Home Maintenance Assistant",
          placeholder: "Ask about maintenance, repairs, or schedule a professional...",
        }}
      />
    </div>
  );
}

// Render component for schedule_professional tool
function ScheduleProfessionalAction() {
  useCopilotAction({
    name: "schedule_professional",
    available: "disabled", // UI render only - tool is server-side
    render: ({ status, args, result }) => {
      if (status !== "complete") {
        return (
          <div className="my-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
              <span>Submitting your service request...</span>
            </div>
          </div>
        );
      }

      const typedResult = result as {
        success?: boolean;
        requestId?: string;
        serviceType?: string;
        alreadyPending?: boolean;
        message?: string;
      };

      // Handle already pending case
      if (typedResult?.alreadyPending) {
        return (
          <RequestStatusAlert
            requestId={typedResult.requestId || ""}
            serviceType={typedResult.serviceType || "general"}
          />
        );
      }

      // Handle success - show polling status alert
      if (typedResult?.success && typedResult.requestId) {
        return (
          <RequestStatusAlert
            requestId={typedResult.requestId}
            serviceType={typedResult.serviceType || "general"}
          />
        );
      }

      // Handle failure
      return (
        <div className="my-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Failed to submit request. Please try again.</span>
          </div>
        </div>
      );
    },
  });

  return null;
}

// Render component for estimate_cost tool
function EstimateCostAction() {
  useCopilotAction({
    name: "estimate_cost",
    available: "disabled",
    render: ({ status }) => {
      if (status !== "complete") {
        return (
          <div className="my-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            Calculating cost estimate...
          </div>
        );
      }

      // Return empty fragment instead of null
      return <></>;
    },
  });

  return null;
}

type UserChatProps = {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  propertyId: string;
  propertyAddress: string;
};

export function UserChat({
  userId,
  userName,
  userEmail,
  userPhone,
  propertyId,
  propertyAddress,
}: UserChatProps) {
  const runtimeUrl = useMemo(
    () => process.env.NEXT_PUBLIC_COPILOTKIT_URL || "http://localhost:3141/copilotkit",
    []
  );

  // Pass user context to CopilotKit
  const properties = useMemo(
    () => ({
      userId,
      userName,
      userEmail,
      userPhone,
      propertyId,
      propertyAddress,
    }),
    [userId, userName, userEmail, userPhone, propertyId, propertyAddress]
  );

  return (
    <CopilotKit runtimeUrl={runtimeUrl} agent="HomeMaintenanceAgent" properties={properties}>
      <ScheduleProfessionalAction />
      <EstimateCostAction />
      <ChatWithStarters userName={userName} />
    </CopilotKit>
  );
}

// Wrapper component that generates mock user context
export function UserChatWithContext() {
  // In a real app, this would come from authentication/session
  const mockUser = useMemo(() => ({
    userId: `USR-${Math.floor(Math.random() * 90000) + 10000}`,
    userName: "John Smith",
    userEmail: "john.smith@email.com",
    userPhone: "0412 345 678",
    propertyId: `PROP-${Math.floor(Math.random() * 9000) + 1000}`,
    propertyAddress: "123 Main Street, Sydney NSW 2000",
  }), []);

  return <UserChat {...mockUser} />;
}
