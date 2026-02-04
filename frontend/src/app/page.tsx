
'use client';

import useSWR from 'swr';
import { api } from '@/services/api';
import DashboardStats from '@/components/DashboardStats';
import CallLogTable from '@/components/CallLogTable';
import { RefreshCcw } from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, error: statsError } = useSWR('stats', api.getStats, {
    refreshInterval: 30000 // Poll every 30s
  });
  
  const { data: calls, error: callsError, mutate: mutateCalls } = useSWR('calls', api.getCalls, {
    refreshInterval: 15000 // Poll every 15s
  });

  const isLoading = !stats || !calls;
  const isError = statsError || callsError;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white/90">
              IVR Support Monitor
            </h1>
            <p className="text-slate-500 mt-1">Live Technical Support Dashboard</p>
          </div>
          
          <button 
            onClick={() => { mutateCalls(); }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
          >
            <RefreshCcw size={16} />
            <span>Refresh</span>
          </button>
        </header>

        {isError && (
          <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg text-red-400">
            Failed to load dashboard data.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-900 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-slate-900 rounded-xl"></div>
          </div>
        ) : (
          <>
            <DashboardStats stats={stats} />
            
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-200">Recent Calls</h2>
                <div className="text-xs text-slate-500">
                  Data real-time from Mock API
                </div>
              </div>
              <CallLogTable calls={calls} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
