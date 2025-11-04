import React from 'react';
import { History, FileAudio } from 'lucide-react';

export default function HistoryDashboard({ items = [], onSelect, onClear }) {
  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
            <History className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Past Transcriptions</h3>
            <p className="text-xs text-white/60">Quickly revisit and download previous results</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10"
        >
          Clear
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-white/60 text-center py-10">No transcriptions yet. They will appear here after processing.</div>
      ) : (
        <ul className="divide-y divide-white/10">
          {items.map((item) => (
            <li key={item.id} className="py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileAudio className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium leading-tight">{item.filename}</p>
                  <p className="text-xs text-white/60">{new Date(item.createdAt).toLocaleString()} • {item.model} • {item.language}</p>
                </div>
              </div>
              <button
                onClick={() => onSelect?.(item)}
                className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                View
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
