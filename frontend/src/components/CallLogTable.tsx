
import React, { useState } from 'react';
import { Play, FileText } from 'lucide-react';
import StatusBadge from './StatusBadge';
import AudioPlayer from './AudioPlayer';
import { CallLog } from '../mocks/data';
import { api } from '../services/api';

export default function CallLogTable({ calls }: { calls: CallLog[] }) {
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (iso: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900/80 text-xs uppercase font-medium text-slate-500">
              <tr>
                <th className="px-6 py-4">Caller / Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{call.callerNumber}</div>
                    <div className="text-xs text-slate-500">{formatTime(call.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={call.status} />
                  </td>
                  <td className="px-6 py-4">
                    {call.agentExtension ? (
                      <span className="font-mono text-slate-300">Ext {call.agentExtension}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {formatDuration(call.callDuration)}
                  </td>
                  <td className="px-6 py-4">
                    {call.ticket && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <FileText size={16} />
                        <span className="text-xs font-medium">#{call.ticket.freshdeskTicketId}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {call.recordingPath && (
                      <button 
                        onClick={() => setSelectedCall(call)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg transition-all text-xs font-medium group"
                      >
                        <Play size={14} className="group-hover:fill-current" />
                        Listen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AudioPlayer 
        isOpen={!!selectedCall} 
        onClose={() => setSelectedCall(null)} 
        src={selectedCall ? api.getAudioUrl(selectedCall.recordingPath || "") : ''} 
        caller={selectedCall?.callerNumber || ''}
      />
    </>
  );
}
