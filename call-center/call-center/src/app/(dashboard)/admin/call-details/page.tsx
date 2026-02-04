"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/service/api";
import { CallStatus } from "@/lib/types/global";

/* =======================
   Helpers
======================= */

const statusColorMap: Record<CallStatus, "secondary" | "destructive" | "default" | "outline"> = {
  ANSWERED: "default",
  MISSED: "destructive",
  BUSY: "outline",
  IVR_ONLY: "secondary",
  IVR_COMPLAINT: "destructive",
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/* =======================
   Page
======================= */

export default function CallDetailsPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callId = searchParams.get("id");

  const { data: call, isLoading, isError } = useQuery({
    queryKey: ["call", callId],
    queryFn: () => api.getCallById(callId || ""),
    enabled: !!callId,
  });

  if (!callId) {
    return (
      <main className="min-h-fit bg-background p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-muted-foreground">No call ID provided.</p>
          <Button className="mt-4" onClick={() => router.push("/admin")}>
            {t("Back to Calls") || "Back to Calls"}
          </Button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-fit bg-background p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (isError || !call || !call.id) {
    return (
      <main className="min-h-fit bg-background p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-destructive">Failed to load call details.</p>
          <Button className="mt-4" onClick={() => router.push("/admin")}>
            {t("Back to Calls") || "Back to Calls"}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-fit bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("Call Details") || "Call Details"}</h1>
            <p className="text-muted-foreground">ID: {call.id}</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin")}>
            {t("Back to Calls") || "Back to Calls"}
          </Button>
        </div>

        {/* Details Card */}
        <div className="border border-border rounded-lg p-6 space-y-6">
          {/* Status & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">{t("Caller Number")}</label>
                <p className="text-lg font-medium">{call.callerNumber}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">{t("Status")}</label>
                <div className="mt-1">
                  <Badge variant={statusColorMap[call.status]} className="text-sm">
                    {call.status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">{t("Agent Extension")}</label>
                <p className="text-lg font-medium">
                  {call.agentExtension || <span className="text-muted-foreground">-</span>}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">{t("Call Duration")}</label>
                <p className="text-lg font-medium">{formatDuration(call.callDuration)}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">{t("Recording Duration")}</label>
                <p className="text-lg font-medium">
                  {call.recordingPath ? formatDuration(call.recordingDuration) : <span className="text-muted-foreground">{t("No Recording")}</span>}
                </p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">{t("Created At")}</label>
                <p className="text-lg font-medium">{new Date(call.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Recording */}
          {call.recordingPath && (
            <div className="border-t border-border pt-6">
              <label className="text-sm text-muted-foreground mb-2 block">{t("Recording")}</label>
              <audio controls className="w-full" src={api.getAudioUrl(call.recordingPath)}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Ticket Info */}
          {call.ticket && (
            <div className="border-t border-border pt-6">
              <label className="text-sm text-muted-foreground mb-2 block">{t("Ticket")}</label>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-base">
                  #{call.ticket.freshdeskTicketId}
                </Badge>
                {call.ticket.issueType && (
                  <span className="text-muted-foreground">
                    Issue Type: {call.ticket.issueType}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}