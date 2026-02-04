import { Call, RangeStats, Stats } from "@/lib/types/global";
import { MOCK_STATS } from "@/mocks/data";

// Use environment variable or default to localhost:3003
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api";

export const api = {
  getStats: async (): Promise<Stats> => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();

      return {
        totalCalls: data.total_calls || 0,
        missedCalls: data.missed_calls || 0,
        avgWaitTime: "N/A",
        ticketsCreated: "N/A",
      };
    } catch (err) {
      console.error(err);
      return MOCK_STATS;
    }
  },

  getRangeStats: async (start?: string, end?: string): Promise<RangeStats> => {
    try {
      const params = new URLSearchParams();
      if (start) params.append("start", start);
      if (end) params.append("end", end);

      const url = `${API_BASE_URL}/stats/range${
        params.toString() ? `?${params}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch range stats");
      const data = await res.json();

      return {
        range: data.range,
        totalCalls: data.total_calls || 0,
        missedCalls: data.missed_calls || 0,
        answeredCalls: data.answered_calls || 0,
        ivrComplaints: data.ivr_complaints || 0,
        byStatus: data.by_status || [],
        avgCallDuration: data.avg_call_duration || 0,
        avgRecordingDuration: data.avg_recording_duration || 0,
      };
    } catch (err) {
      console.error(err);
      return {
        range: { start: "", end: "" },
        totalCalls: 0,
        missedCalls: 0,
        answeredCalls: 0,
        ivrComplaints: 0,
        byStatus: [],
        avgCallDuration: 0,
        avgRecordingDuration: 0,
      };
    }
  },

  getCalls: async (): Promise<Call[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/logs?limit=50`);
      if (!res.ok) throw new Error("Failed to fetch calls");
      const data: Call[] = await res.json();
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  getAudioUrl: (filename: string): string => {
    if (!filename) return "";
    const name = filename.split("/").pop()?.split("\\").pop();
    return `${API_BASE_URL}/recordings/${name}`;
  },

  getCallById: async (id: string): Promise<Call> => {
    try {
      const res = await fetch(`${API_BASE_URL}/logs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch call");
      const data: Call = await res.json();
      return data;
    } catch (err) {
      console.error(err);
      return {} as Call;
    }
  },
};
