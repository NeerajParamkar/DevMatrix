"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getDevelopers, getDevVersionHistory, getProjectState, VersionHistoryEntry } from "@/lib/api";
import { Terminal, LogOut, Link2, Copy, CheckCircle2, GitBranch, RefreshCw, AlertTriangle, MessageSquare } from "lucide-react";

type OrgInfo = { id: string; name: string };
type LinkedProject = { id: string; name: string; devId: string };

export default function DeveloperDashboard() {
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<LinkedProject[]>([]);
  const [history, setHistory] = useState<VersionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);
    const name = user.user_metadata?.full_name ?? user.email ?? "Developer";
    setUserName(name);

    // Get org membership
    const { data: member } = await supabase
      .from("organization_members")
      .select("role, organizations(id, name)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (member?.organizations) {
      const o = member.organizations as any;
      setOrg({ id: o.id, name: o.name });

      // Get projects where this user is linked by user_id in developers table
      const { data: devRows } = await supabase
        .from("developers")
        .select("id, project_id, projects(name)")
        .eq("user_id", user.id);

      const linked: LinkedProject[] = (devRows ?? []).map((row: any) => ({
        id: row.project_id,
        name: row.projects?.name ?? row.project_id,
        devId: row.id,
      }));
      setProjects(linked);

      // Get recent version history across all linked projects
      const allHistory: VersionHistoryEntry[] = [];
      for (const p of linked) {
        const h = await getDevVersionHistory(p.id, p.devId, 5);
        allHistory.push(...h);
      }
      allHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setHistory(allHistory.slice(0, 15));
    }
    setLoading(false);
  }

  const copyLinkCommand = () => {
    if (!userId) return;
    navigator.clipboard.writeText(`dmx link ${userId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-neutral-400">
      Loading your workspace…
    </div>
  );

  const isLinked = projects.length > 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <Terminal className="h-6 w-6 text-white" />
            <span className="font-bold text-lg tracking-tight">DevMatrix</span>
            <span className="ml-2 px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold">Developer</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/messages" className="p-2 rounded-lg hover:bg-white/10 transition text-neutral-400 hover:text-white relative">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-black"></span>
            </Link>
            <span className="text-sm text-neutral-400 ml-2">{userName}</span>
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-white/10 transition text-neutral-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold">Welcome, {userName.split(" ")[0]}</h1>
          <p className="text-neutral-400 mt-1">Team: <span className="text-white font-medium">{org?.name}</span></p>
        </div>

        {/* CLI Link Card */}
        <div className={`rounded-xl border p-6 ${isLinked ? "border-green-800 bg-green-950/20" : "border-amber-800 bg-amber-950/20"}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLinked ? "bg-green-500/20" : "bg-amber-500/20"}`}>
                {isLinked ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Link2 className="w-5 h-5 text-amber-400" />}
              </div>
              <div>
                <p className={`font-semibold ${isLinked ? "text-green-300" : "text-amber-300"}`}>
                  {isLinked ? "CLI Linked ✓" : "Link your CLI"}
                </p>
                <p className="text-sm text-neutral-400">
                  {isLinked
                    ? `${projects.length} machine(s) syncing to this account.`
                    : "Run this command in your terminal to connect your local CLI."}
                </p>
              </div>
            </div>
            {!isLinked && (
              <button onClick={loadData} className="p-2 text-neutral-500 hover:text-white transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isLinked && (
            <div className="mt-4 bg-black border border-neutral-800 rounded-lg p-3 flex items-center justify-between">
              <code className="text-green-400 text-sm font-mono">dmx link {userId}</code>
              <button onClick={copyLinkCommand} className="p-1 text-neutral-500 hover:text-white transition">
                {linkCopied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Linked Projects */}
        {isLinked && (
          <div>
            <h2 className="text-lg font-bold mb-4">Your Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(p => (
                <Link key={p.id} href={`/project/${p.id}`}>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 hover:border-neutral-600 transition cursor-pointer">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs font-mono text-neutral-500 mt-1">{p.id}</p>
                    <div className="mt-3 text-xs text-blue-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Syncing
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sync History */}
        <div>
          <h2 className="text-lg font-bold mb-4">Your Sync History</h2>
          {history.length === 0 && (
            <div className="border border-dashed border-neutral-800 rounded-xl py-10 text-center text-neutral-600 text-sm">
              No sync history yet. Run <code className="text-green-400">dmx logs push</code> to record a snapshot.
            </div>
          )}
          <div className="space-y-3">
            {history.map(entry => {
              const added = entry.changes?.added?.length ?? 0;
              const updated = entry.changes?.updated?.length ?? 0;
              const removed = entry.changes?.removed?.length ?? 0;
              return (
                <div key={entry.id} className="flex items-start gap-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <GitBranch className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-300 truncate">{entry.message}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      {added > 0 && <span className="text-green-400">+{added} added</span>}
                      {updated > 0 && <span className="text-yellow-400">↑{updated} updated</span>}
                      {removed > 0 && <span className="text-red-400">−{removed} removed</span>}
                      <span className="text-neutral-600">{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
