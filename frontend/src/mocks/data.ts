export interface CallLog {
  id: number;
  callerNumber: string;
  agentExtension?: string;
  callDuration: number; // in seconds
  status: "ANSWERED" | "MISSED" | "BUSY" | "IVR_ONLY" | "IVR_COMPLAINT";
  recordingPath?: string | null;
  recordingDuration?: number;
  createdAt: string; // ISO date
  ticket?: Ticket | null;
}

export interface Ticket {
  id: number;
  freshdeskTicketId: string;
  callId: number;
  issueType?: string;
  createdAt: string;
}

// Keep mock data structure aligned for fallback or tests
export const MOCK_CALLS: CallLog[] = [
  {
    id: 1,
    callerNumber: "+1234567890",
    agentExtension: "101",
    call_duration: 120,
    status: "ANSWERED",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 2,
    callerNumber: "+1987654321",
    call_duration: 0,
    status: "MISSED",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 3,
    callerNumber: "+1122334455",
    call_duration: 45,
    status: "IVR_COMPLAINT",
    recordingPath: "/mock-audio.mp3",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    ticket: {
      id: 101,
      freshdeskTicketId: "#FD-2024-001",
      callId: 3,
      issueType: "Billing",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  },
];

export const MOCK_STATS = {
  totalCalls: 45,
  missedCalls: 12,
  avgWaitTime: "01:45",
  ticketsCreated: 5,
};
