export type CallStatus =
  | "ANSWERED"
  | "MISSED"
  | "BUSY"
  | "IVR_ONLY"
  | "IVR_COMPLAINT";

export interface Ticket {
  id: number;
  freshdeskTicketId: string;
  issueType: string;
  createdAt: string;
}

export interface Call {
  id: number;
  callerNumber: string;
  agentExtension: string | null;
  callDuration: number;
  status: CallStatus;
  recordingPath: string | null;
  recordingDuration: number;
  createdAt: string;
  ticket: Ticket | null;
}

export interface Stats {
  totalCalls: number;
  missedCalls: number;
  avgWaitTime: string;
  ticketsCreated: string | number;
}

export interface RangeStats {
  range: {
    start: string;
    end: string;
  };
  totalCalls: number;
  missedCalls: number;
  answeredCalls: number;
  ivrComplaints: number;
  byStatus: { status: string; count: number }[];
  avgCallDuration: number;
  avgRecordingDuration: number;
}
