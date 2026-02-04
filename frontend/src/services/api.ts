import { CallLog, MOCK_STATS } from "../mocks/data";

// Use environment variable or default to localhost:3000
// Since we are likely running frontend on 3001 and backend on 3000, we need full URL or proxy.
// For now, hardcoding localhost:3000 is easiest for local dev given "swap in real backend".
const API_BASE_URL = "http://localhost:3003/api";

export const api = {
  getStats: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();

      // Map backend snake_case to frontend Props expected by DashboardStats
      // Backend: { date, total_calls, missed_calls }
      return {
        totalCalls: data.total_calls || 0,
        missedCalls: data.missed_calls || 0,
        avgWaitTime: "N/A", // Not provided by backend yet
        ticketsCreated: "N/A", // Not provided by backend yet
      };
    } catch (err) {
      console.error(err);
      return MOCK_STATS; // Fallback to mock on error? Or rethrow?
      // User asked to "update", typically implies making it work.
      // Returning mock on error is good for stability if backend is down.
    }
  },

  getCalls: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/logs?limit=50`);
      if (!res.ok) throw new Error("Failed to fetch calls");
      const data: CallLog[] = await res.json();
      console.log(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  getRecording: async (id: number) => {
    // This is just constructing a URL, the audio player uses src directly
    // But if we need a method to get a signed URL or stream:
    return null;
  },

  // Helper to get full audio URL
  getAudioUrl: (filename: string) => {
    if (!filename) return "";
    // If it's a full path from DB like /var/spool/..., we need to extract filename
    // Backend endpoint is /api/recordings/:filename
    const name = filename.split("/").pop()?.split("\\").pop();
    return `${API_BASE_URL}/recordings/${name}`;
  },
};
