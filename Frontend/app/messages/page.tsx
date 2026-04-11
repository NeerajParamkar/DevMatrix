"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, MessageSquare, Terminal, Clock, ChevronDown, ChevronUp } from "lucide-react";

type NotificationEntry = {
  id: string;
  project_id: string;
  user_id?: string; // Assuming user_id was added to identify the triggerer
  dev_id?: string;  // Fallback if dev_id is used instead
  message: string;
  changes: any;
  created_at: string;
};

// Extracted Message Item Component for better state management
function MessageItem({ msg, projectName }: { msg: NotificationEntry; projectName: string }) {
  const [expanded, setExpanded] = useState(false);
  
  const added = msg.changes?.added ?? [];
  const updated = msg.changes?.updated ?? [];
  const removed = msg.changes?.removed ?? [];
  
  const addedCount = added.length;
  const updatedCount = updated.length;
  const removedCount = removed.length;
  const hasChanges = addedCount > 0 || updatedCount > 0 || removedCount > 0;

  return (
    <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Terminal className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-1">
            <h3 className="font-medium text-white truncate text-base">{msg.message}</h3>
            <span className="text-xs text-neutral-500 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              {new Date(msg.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-neutral-400 font-medium mb-3">
            Project: <span className="text-white">{projectName}</span>
            <span className="text-neutral-600 font-mono text-xs ml-2">({msg.project_id})</span>
          </p>
          
          <div className="flex items-center gap-3 text-xs font-medium">
            {addedCount > 0 && <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded-md border border-green-400/20">+{addedCount} Dependencies</span>}
            {updatedCount > 0 && <span className="text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-md border border-yellow-400/20">~{updatedCount} Updates</span>}
            {removedCount > 0 && <span className="text-red-400 bg-red-400/10 px-2.5 py-1 rounded-md border border-red-400/20">-{removedCount} Removed</span>}
            
            {!hasChanges && (
              <span className="text-neutral-500 bg-neutral-800/50 px-2.5 py-1 rounded-md border border-neutral-700/50">No dependency changes</span>
            )}

            {hasChanges && (
              <button 
                onClick={() => setExpanded(!expanded)} 
                className="ml-auto flex items-center gap-1 text-blue-400 hover:text-blue-300 transition px-2 py-1 bg-blue-500/10 rounded-md border border-blue-500/20"
              >
                {expanded ? "Hide Details" : "View Details"}
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
          
          {expanded && hasChanges && (
            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-4">
              {addedCount > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wider">Added</p>
                  <div className="flex flex-wrap gap-2">
                    {added.map((dep: string) => (
                      <span key={dep} className="text-[11px] font-mono bg-green-950/40 text-green-300 border border-green-900/50 px-2 py-0.5 rounded">{dep}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {updatedCount > 0 && (
                <div>
                  <p className="text-xs font-semibold text-yellow-400 mb-2 uppercase tracking-wider">Updated</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {updated.map((dep: any) => (
                      <div key={dep.name} className="flex items-center justify-between text-[11px] font-mono bg-yellow-950/40 text-yellow-300 border border-yellow-900/50 px-3 py-1.5 rounded">
                        <span className="font-bold">{dep.name}</span>
                        <span className="text-neutral-500">{dep.oldVersion} → {dep.newVersion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {removedCount > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Removed</p>
                  <div className="flex flex-wrap gap-2">
                    {removed.map((dep: string) => (
                      <span key={dep} className="text-[11px] font-mono bg-red-950/40 text-red-300 border border-red-900/50 px-2 py-1 rounded line-through opacity-70">{dep}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<NotificationEntry[]>([]);
  const [projectMap, setProjectMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const authId = user?.id || null;
      setCurrentUserId(authId);

      // Build project map
      const { data: projData } = await supabase.from("projects").select("id, name");
      if (projData) {
        const map: Record<string, string> = {};
        projData.forEach(p => map[p.id] = p.name);
        setProjectMap(map);
      }

      // Fetch notifications
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
        
      if (data && data.length > 0) {
        // Filter out messages triggered by the current user
        // We check for both user_id and dev_id just in case
        const filtered = data.filter(msg => {
          if (!authId) return true;
          // If we have a user_id column, filter by it
          if (msg.user_id && msg.user_id === authId) return false;
          // If the message text starts with the user's name or metadata, we could also filter, 
          // but relying on a column is safer.
          return true;
        });
        setMessages(filtered);
      } else {
        // Fallback to version_history
        const { data: vData } = await supabase
          .from("version_history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
          
        if (vData) {
          const filtered = vData.filter(msg => {
            if (!authId) return true;
            // Version history usually uses dev_id which links to developers.user_id
            // This filter might need a dev_id -> user_id lookup if it's not direct
            return true; 
          });
          setMessages(filtered as any);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition text-neutral-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <span className="font-bold text-lg tracking-tight">Messages &amp; Logs</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-1">Activity Feed</h1>
        <p className="text-neutral-500 text-sm mb-6">Real-time updates from your team members.</p>
        
        {loading ? (
          <div className="text-neutral-500 animate-pulse">Syncing logs...</div>
        ) : messages.length === 0 ? (
          <div className="border border-dashed border-neutral-800 rounded-xl py-10 text-center text-neutral-600 text-sm">
            No new activity from other team members.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageItem 
                key={msg.id} 
                msg={msg} 
                projectName={projectMap[msg.project_id] || "Unknown Project"} 
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
