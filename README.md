# Home Maintenance AI Agent

A Next.js application featuring an AI-powered home maintenance assistant with human-in-the-loop (HITL) functionality. This project serves as a starter template for interview candidates to demonstrate AI and software engineering skills.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **AI**: Vercel AI SDK with OpenAI
- **Styling**: Tailwind CSS + shadcn/ui components
- **Validation**: Zod schemas

## Features

### AI Agent Capabilities
- **Maintenance Tips**: Get practical advice for common home maintenance issues
- **Cost Estimates**: Receive rough cost estimates for repairs (DIY vs professional)
- **Schedule Repairs**: Book repair appointments with approval workflow
- **Request Contractors**: Find and request qualified contractors with approval workflow

### Human-in-the-Loop Workflows
The agent includes workflows that pause for user approval before taking action:
- **Schedule Repair**: Select date/time, review details, then confirm or cancel
- **Request Contractor**: Choose from available contractors, then submit request

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd home-maintenance-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your OpenAI API key:
```bash
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Chat interface page
│   └── api/
│       ├── chat/route.ts       # Chat endpoint with AI tools
│       └── workflow/[id]/resume/route.ts  # Workflow resume endpoint
├── agents/
│   └── home-maintenance.ts     # Agent definition
├── tools/
│   ├── index.ts
│   ├── get-maintenance-tips.ts # Maintenance advice tool
│   └── estimate-cost.ts        # Cost estimation tool
├── workflows/
│   ├── index.ts
│   ├── schedule-repair.ts      # HITL repair scheduling
│   └── request-contractor.ts   # HITL contractor request
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx  # Main chat container
│   │   ├── message-list.tsx    # Message display
│   │   ├── message-bubble.tsx  # Individual message
│   │   ├── input-form.tsx      # Message input
│   │   └── approval-card.tsx   # HITL approval UI
│   └── ui/                     # shadcn components
├── hooks/
│   └── use-chat.ts             # Chat state management
└── lib/
    └── utils.ts                # Utility functions
```

## Verification

Test the application by following these steps:

1. Start the dev server and navigate to http://localhost:3000
2. Send: "I have a leaky faucet, can you help?"
   - The agent should respond with maintenance tips
3. Send: "How much would it cost to fix?"
   - The agent should provide cost estimates
4. Send: "Can you schedule a repair for next Monday?"
   - An approval card should appear with date/time options
5. Approve or reject the scheduling request
6. Verify the agent handles both cases correctly

---

## Interview Tasks

Below are suggested tasks for candidates to work on. Choose one or more based on your interests and the role requirements.

### Task 1: Add a New Tool - Seasonal Maintenance Checklist

Create a tool that returns seasonal maintenance tasks based on the current month.

**Requirements:**
- Define a Zod schema for the tool parameters (optional: season or month input)
- Categorize tasks by area: HVAC, plumbing, exterior, interior
- Return tasks appropriate for the current season
- Include priority levels and estimated time for each task

**Evaluation Criteria:**
- Zod schema design
- Code organization
- Data structure decisions
- Integration with existing tools

### Task 2: Enhance the Schedule Repair Workflow

Improve the repair scheduling workflow with additional features.

**Requirements:**
- Add time slot selection (morning, afternoon, evening)
- Implement an emergency repair option that skips approval for critical issues
- Add the ability to attach photos or notes to the repair request
- Handle workflow cancellation gracefully with confirmation

**Evaluation Criteria:**
- Workflow state management
- User experience considerations
- Error handling
- Type safety

### Task 3: Add Conversation Memory

Implement persistent memory to remember user's home details across conversations.

**Requirements:**
- Store home information: type (house/apartment), age, square footage
- Remember previous issues and repairs
- Use stored context to personalize recommendations
- Allow users to update their home profile

**Evaluation Criteria:**
- State persistence strategy
- Context integration in prompts
- Privacy considerations
- API design

### Task 4: Improve the UI/UX

Enhance the chat interface with better user experience features.

**Requirements:**
- Add typing indicators while the agent is responding
- Show tool execution status in the chat (e.g., "Getting maintenance tips...")
- Implement dark mode support
- Add message timestamps and grouping by date
- Make suggestion chips functional

**Evaluation Criteria:**
- React patterns and hooks usage
- CSS/Tailwind proficiency
- Attention to detail
- Accessibility considerations

### Task 5: Add Error Handling & Edge Cases

Improve the application's resilience and error handling.

**Requirements:**
- Handle API rate limits gracefully with retry logic
- Add proper error boundaries and fallback UI
- Implement input validation on the frontend
- Add loading skeletons for better perceived performance
- Handle network disconnection scenarios

**Evaluation Criteria:**
- Error handling patterns
- User feedback mechanisms
- Code quality
- Testing approach

---

## Candidate Evaluation Criteria

Candidates will be evaluated on:

1. **Code Quality**
   - TypeScript usage and type safety
   - Code organization and modularity
   - Naming conventions and readability

2. **AI/Agent Patterns**
   - Understanding of tools and workflows
   - Prompt engineering considerations
   - HITL workflow design

3. **Frontend Skills**
   - React patterns and hooks
   - State management
   - Component design

4. **Problem Solving**
   - Approach to breaking down tasks
   - Handling edge cases
   - Making trade-off decisions

5. **Communication**
   - Code comments where needed
   - Documentation updates
   - Explanation of decisions

## Resources

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev)
- [shadcn/ui Components](https://ui.shadcn.com)

## License

MIT
