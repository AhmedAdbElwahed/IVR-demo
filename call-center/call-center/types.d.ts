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
