"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableHead, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Phone, PhoneMissed, PhoneIncoming, Clock, MessageSquare, PhoneCall } from "lucide-react";

import { api } from "@/service/api";
import { Call, CallStatus } from "@/lib/types/global";

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
   Stat Card Component
======================= */

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  variant?: "default" | "success" | "danger" | "warning" | "info";
}

function StatCard({ title, value, icon, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "bg-card border-border",
    success: "bg-emerald-500/10 border-emerald-500/20",
    danger: "bg-red-500/10 border-red-500/20",
    warning: "bg-amber-500/10 border-amber-500/20",
    info: "bg-blue-500/10 border-blue-500/20",
  };

  const iconStyles = {
    default: "text-muted-foreground",
    success: "text-emerald-500",
    danger: "text-red-500",
    warning: "text-amber-500",
    info: "text-blue-500",
  };

  return (
    <div className={`rounded-xl border p-4 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-background/50 ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =======================
   Page
======================= */

export default function CallsPage() {
  const t = useTranslations();
  const router = useRouter();

  const pageSize = 5;
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<CallStatus | null>(null);

  // Fetch stats using TanStack Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["rangeStats"],
    queryFn: () => api.getRangeStats(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Fetch calls using TanStack Query
  const { data: calls = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["calls"],
    queryFn: api.getCalls,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  /* Filter */
  const filteredCalls = useMemo(
    () =>
      selectedStatus
        ? calls.filter((c) => c.status === selectedStatus)
        : calls,
    [selectedStatus, calls]
  );

  /* Pagination */
  const paginatedCalls = useMemo(
    () =>
      filteredCalls.slice(
        (page - 1) * pageSize,
        page * pageSize
      ),
    [filteredCalls, page]
  );

  const STATUS_FILTERS: { value: CallStatus; label: string }[] = [
    { value: "ANSWERED", label: t("Answered") },
    { value: "MISSED", label: t("Missed") },
    { value: "IVR_ONLY", label: t("IVR Only") },
    { value: "IVR_COMPLAINT", label: t("IVR Complaint") },
  ];

  return (
    <main className="min-h-fit bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Stats Dashboard */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t("Dashboard") || "Dashboard"}</h2>
            {stats?.range && (
              <span className="text-sm text-muted-foreground">
                {stats.range.start} → {stats.range.end}
              </span>
            )}
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-card border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard
                title={t("Total Calls") || "Total Calls"}
                value={stats?.totalCalls || 0}
                icon={<Phone size={20} />}
                variant="info"
              />
              <StatCard
                title={t("Answered") || "Answered"}
                value={stats?.answeredCalls || 0}
                icon={<PhoneIncoming size={20} />}
                variant="success"
              />
              <StatCard
                title={t("Missed") || "Missed"}
                value={stats?.missedCalls || 0}
                icon={<PhoneMissed size={20} />}
                variant="danger"
              />
              <StatCard
                title={t("IVR Complaint") || "IVR Complaint"}
                value={stats?.ivrComplaints || 0}
                icon={<MessageSquare size={20} />}
                variant="warning"
              />
              <StatCard
                title={t("Avg Call Duration") || "Avg Call Duration"}
                value={formatDuration(stats?.avgCallDuration || 0)}
                icon={<Clock size={20} />}
              />
              <StatCard
                title={t("Avg Recording") || "Avg Recording"}
                value={formatDuration(stats?.avgRecordingDuration || 0)}
                icon={<PhoneCall size={20} />}
              />
            </div>
          )}
        </section>

        {/* Calls Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t("Recent Calls") || "Recent Calls"}</h2>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedStatus === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedStatus(null);
                  setPage(1);
                }}
              >
                {t("All Calls")}
              </Button>

              {STATUS_FILTERS.map((status) => (
                <Button
                  key={status.value}
                  variant={
                    selectedStatus === status.value
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    setSelectedStatus(status.value);
                    setPage(1);
                  }}
                >
                  {status.label}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {t("Refresh") || "Refresh"}
              </Button>
              <Button onClick={() => router.push("/calls/export")}>
                {t("Export")}
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex items-center justify-center py-12 text-destructive">
              Failed to load calls. Please try again.
            </div>
          )}

          {/* Table */}
          {!isLoading && !isError && (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table<Call>
                data={paginatedCalls}
                pageSize={pageSize}
                pagination={{
                  currentPage: page,
                  totalPages: Math.ceil(
                    filteredCalls.length / pageSize
                  ),
                  totalItems: filteredCalls.length,
                  pageSize,
                  onPageChange: setPage,
                }}
                columns={[
                  { key: "id", label: t("ID"), className: "w-20" },
                  { key: "callerNumber", label: t("Caller Number") },
                  {
                    key: "status",
                    label: t("Status"),
                    render: (_, row) => (
                      <Badge variant={statusColorMap[row.status]}>
                        {row.status}
                      </Badge>
                    ),
                  },
                  {
                    key: "callDuration",
                    label: t("Call Duration"),
                    render: (_, row) => formatDuration(row.callDuration),
                  },
                  {
                    key: "recordingDuration",
                    label: t("Recording"),
                    render: (_, row) =>
                      row.recordingPath ? (
                        <span>{formatDuration(row.recordingDuration)}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("No Recording")}
                        </span>
                      ),
                  },
                  {
                    key: "ticket",
                    label: t("Ticket"),
                    render: (_, row) =>
                      row.ticket ? (
                        <Badge variant="outline">
                          #{row.ticket.freshdeskTicketId}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("No Ticket")}
                        </span>
                      ),
                  },
                  {
                    key: "createdAt",
                    label: t("Created At"),
                    render: (_, row) =>
                      new Date(row.createdAt).toLocaleString(),
                  },
                  {
                    key: "actions" as keyof Call,
                    label: t("Actions") || "Actions",
                    render: (_, row) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/call-details?id=${row.id}`)}
                      >
                        {t("View") || "View"}
                      </Button>
                    ),
                  },
                ]}
              >
                <TableHead />
                <TableBody />
              </Table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}