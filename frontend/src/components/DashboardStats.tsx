
import React from 'react';
import { Phone, PhoneMissed, PhoneIncoming, Ticket } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  isAlert?: boolean;
}

function StatCard({ title, value, icon: Icon, isAlert }: StatCardProps) {
  return (
    <div className={`p-6 rounded-xl border backdrop-blur-sm ${
      isAlert 
        ? 'bg-red-950/10 border-red-900/30 text-red-100' 
        : 'bg-slate-900/50 border-slate-800 text-slate-100'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className={`mt-2 text-3xl font-bold ${isAlert ? 'text-red-400' : 'text-white'}`}>
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${
          isAlert ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
        }`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats({ stats }: { stats: any }) {
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard 
        title="Total Calls" 
        value={stats.totalCalls} 
        icon={Phone} 
      />
      <StatCard 
        title="Missed Calls" 
        value={stats.missedCalls} 
        icon={PhoneMissed} 
        isAlert={true}
      />
      <StatCard 
        title="Avg. Wait Time" 
        value={stats.avgWaitTime} 
        icon={PhoneIncoming} 
      />
      <StatCard 
        title="Tickets Created" 
        value={stats.ticketsCreated} 
        icon={Ticket} 
      />
    </div>
  );
}
