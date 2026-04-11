"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import {
  getDevelopers, getProjectState, getVersionHistory, getProject,
  Developer, ProjectLatestState, VersionHistoryEntry, Project,
  subscribeToVersionHistory
} from "@/lib/api";
import {
  ArrowLeft, Copy, Database, CheckCircle2, AlertTriangle,
  RefreshCw, Zap, Clock, GitBranch, Terminal
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [officialState, setOfficialState] = useState<ProjectLatestState | null>(null);
  const [versionHistory, setVersionHistory] = useState<VersionHistoryEntry[]>([]);
  const [selectedDev, setSelectedDev] = useState<Developer | null>(null);
  const [devTab, setDevTab] = useState<"deps" | "env" | "history">("deps");
  const [userRole, setUserRole] = useState<"admin" | "developer" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Optional navbar logic
  const [userName, setUserName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.full_name ?? data.user.email ?? "User");
      } else {
        window.location.href = "/login";
      }
    });
    loadData();

    // Real-time subscription to version history
    const channel = subscribeToVersionHistory(projectId, (entry) => {
      setVersionHistory(prev => [entry, ...prev]);
    });

    return () => { channel.unsubscribe(); };
  }, [projectId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [proj, devs, official, history] = await Promise.all([
        getProject(projectId),
        getDevelopers(projectId),
        getProjectState(projectId),
        getVersionHistory(projectId),
      ]);
      setProject(proj);
      setDevelopers(devs);
      setOfficialState(official);
      setVersionHistory(history);

      // Fetch user role for this org
      const { data: { user } } = await supabase.auth.getUser();
      if (user && proj) {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('org_id', proj.org_id)
          .maybeSingle();
        if (membership) setUserRole(membership.role as any);
      }
      
      // Auto-select first dev if none selected
      if (devs.length > 0 && !selectedDev) setSelectedDev(devs[0]);
      // Update selected dev reference if it exists
      else if (selectedDev) setSelectedDev(devs.find(d => d.id === selectedDev.id) ?? devs[0]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Check if a dep version differs from official state
  function isOutdated(name: string, version: string): boolean {
    if (!officialState?.dependencies) return false;
    const official = officialState.dependencies[name];
    return !!official && official !== version;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const activeDevIsStale = selectedDev && selectedDev.last_active 
    ? (Date.now() - new Date(selectedDev.last_active).getTime()) > 10 * 60 * 1000 
    : true;

  const perfectDev = officialState?.dependencies 
    ? developers.find(dev => {
        if (!dev.dependencies || Object.keys(dev.dependencies).length === 0) return false;
        return !Object.entries(dev.dependencies).some(([name, version]) => isOutdated(name, version));
      })
    : null;

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-neutral-400">Loading project environment…</div>;
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar to match Dashboard/Admin */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <Link href={userRole === 'admin' ? "/admin" : "/dashboard"} className="flex items-center gap-3 text-neutral-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="ml-8 flex items-center gap-3">
            <Terminal className="h-5 w-5 text-neutral-500" />
            <span className="font-semibold text-neutral-200">{project?.name ?? projectId}</span>
          </div>
          <div className="ml-auto">
             <button onClick={loadData} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-sm text-neutral-300 hover:bg-neutral-800 transition">
               <RefreshCw className="w-3.5 h-3.5" /> Refresh
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-800 text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadData} className="px-3 py-1 bg-red-900/50 hover:bg-red-800 transition rounded text-sm">Retry</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{project?.name ?? projectId}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs bg-neutral-950 px-2.5 py-1 rounded-md text-neutral-400 border border-neutral-800 flex items-center gap-2 transition hover:border-neutral-600">
                {projectId}
                <button onClick={() => copyToClipboard(projectId)} className="hover:text-white transition group" title="Copy Project ID">
                  {copiedText === projectId ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />}
                </button>
              </span>
              {officialState ? (
                <span className="text-xs text-neutral-500 flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> 
                  Official updated by <strong className="text-neutral-300">{officialState.updated_by_name}</strong>
                </span>
              ) : (
                <span className="text-xs text-neutral-600 border border-neutral-800 px-2.5 py-1 rounded border-dashed">No official state logged</span>
              )}
              {perfectDev && (
                <span className="text-xs text-green-400 flex items-center gap-1.5 bg-green-950/20 px-2.5 py-1 rounded border border-green-900/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 
                  <strong className="text-green-300 font-bold">{perfectDev.name}</strong> aligns with official
                </span>
              )}
            </div>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-5 py-3 shadow-lg flex items-center gap-4">
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">CLI Join Command</p>
              <code className="text-sm font-mono text-green-400 font-bold">dmx init {projectId}</code>
            </div>
            <button onClick={() => copyToClipboard(`dmx init ${projectId}`)} className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 transition">
              {copiedText === `dmx init ${projectId}` ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
          
          {/* Left Sidebar - Developers */}
          <div className="col-span-1 space-y-4">
            <h3 className="font-semibold text-neutral-300 px-1 border-b border-neutral-800 pb-3 flex items-center justify-between">
              Connected Nodes 
              <span className="bg-neutral-900 text-neutral-400 text-xs px-2 py-0.5 rounded-full border border-neutral-800">{developers.length}</span>
            </h3>
            
            {developers.length === 0 && (
              <div className="border border-dashed border-neutral-800 rounded-xl p-6 text-center">
                <p className="text-sm text-neutral-500">No nodes connected yet.</p>
              </div>
            )}

            <div className="space-y-2">
              {developers.map(dev => {
                const isActive = dev.last_active ? (Date.now() - new Date(dev.last_active).getTime()) < 10 * 60 * 1000 : false;
                const isSelected = selectedDev?.id === dev.id;
                
                return (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDev(dev)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-neutral-900 border-neutral-600 shadow-md ring-1 ring-white/5' 
                        : 'bg-black border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`font-semibold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>{dev.name}</span>
                      <div className="flex items-center gap-2">
                        {dev.synced_from && <span className="text-[10px] uppercase font-bold text-blue-400 border border-blue-900 bg-blue-950/30 px-1.5 py-0.5 rounded">Synced</span>}
                        <div className="relative">
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-neutral-600'}`} />
                          {isActive && <div className="absolute inset-0 bg-green-500 rounded-full blur animate-pulse opacity-50" />}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {dev.last_active ? new Date(dev.last_active).toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' }) : 'Never'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content - Dev Environment details */}
          <div className="col-span-3">
            {selectedDev ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                {/* Dev Header */}
                <div className="p-6 border-b border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      {selectedDev.name}&apos;s Environment
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      {activeDevIsStale ? "This node is currently offline." : "This node is actively syncing data."}
                    </p>
                  </div>
                  <div className="flex bg-black border border-neutral-800 rounded-lg p-1.5 items-center">
                     <span className="text-neutral-500 text-xs px-3 py-1 font-mono">dmx update {selectedDev.name}</span>
                     <button onClick={() => copyToClipboard(`dmx update ${selectedDev.name}`)} className="p-1.5 bg-neutral-900 hover:bg-neutral-700 rounded transition ml-2">
                       {copiedText === `dmx update ${selectedDev.name}` ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Zap className="w-3.5 h-3.5 text-blue-400" />}
                     </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-neutral-900/20 border-b border-neutral-800 px-4">
                  {(["deps", "env", "history"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDevTab(tab)}
                      className={`px-5 py-3.5 text-sm font-semibold transition-colors relative ${
                        devTab === tab ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {tab === "deps" ? "Dependencies" : tab === "env" ? "Environment Keys" : "Version Logs"}
                      {devTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-black/20 min-h-[400px]">
                  
                  {/* Dependencies Tab */}
                  {devTab === "deps" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-900/50 border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Package Name</th>
                            <th className="px-6 py-4 font-semibold">Detected Version</th>
                            <th className="px-6 py-4 font-semibold">Official Master</th>
                            <th className="px-6 py-4 font-semibold w-24">Health</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900">
                          {Object.entries(selectedDev.dependencies ?? {}).map(([name, version]) => {
                            const outdated = isOutdated(name, version);
                            const offVer = officialState?.dependencies[name];
                            return (
                              <tr key={name} className={`hover:bg-neutral-900/30 transition-colors ${outdated ? 'bg-red-950/10' : ''}`}>
                                <td className="px-6 py-3.5 font-mono text-neutral-300 font-medium">{name}</td>
                                <td className={`px-6 py-3.5 font-mono ${outdated ? 'text-red-400 font-bold' : 'text-neutral-400'}`}>
                                  {version}
                                </td>
                                <td className="px-6 py-3.5 font-mono text-neutral-500">
                                  {offVer ?? <span className="text-neutral-700 italic">untracked</span>}
                                </td>
                                <td className="px-6 py-3.5">
                                  {outdated ? (
                                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-950/50 px-2 py-1 rounded inline-flex border border-red-900/50">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Drift
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium bg-green-950/20 px-2 py-1 rounded inline-flex border border-green-900/30">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Aligned
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {Object.keys(selectedDev.dependencies ?? {}).length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-neutral-600 border-dashed border border-neutral-800 rounded-lg mx-4 mt-4">Node has not synced any dependency fingerprints.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Env Keys Tab */}
                  {devTab === "env" && (
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-500/20 p-2 rounded-lg">
                            <Database className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-indigo-100">Environment Key Audit</h3>
                            <p className="text-xs text-indigo-300/70 mt-0.5">Secure snapshot of local .env shape</p>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-0 text-[10px] uppercase tracking-widest font-bold text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded bg-indigo-950/50">
                          Values Masked
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(selectedDev.env_keys ?? {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-3 rounded-lg border border-neutral-800 bg-black/40 hover:bg-neutral-900 transition">
                            <span className="text-sm font-mono text-neutral-300 truncate mr-4"><span className="text-neutral-600 select-none">$</span> {key}</span>
                            <span className="font-mono text-xs px-2 py-1 rounded bg-neutral-900 text-neutral-500 border border-neutral-800 whitespace-nowrap">
                              {value || <span className="text-red-900">N/A</span>}
                            </span>
                          </div>
                        ))}
                        {Object.keys(selectedDev.env_keys ?? {}).length === 0 && (
                          <div className="col-span-1 md:col-span-2 text-center py-10 border border-dashed border-neutral-800 rounded-xl text-neutral-600 text-sm">
                            No environment variables detected
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* History Tab */}
                  {devTab === "history" && (
                    <div className="p-6">
                      <div className="relative border-l border-neutral-800 ml-4 space-y-8 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {versionHistory.filter(h => h.dev_id === selectedDev.id).length === 0 && (
                          <div className="-ml-4 text-center py-10 border border-dashed border-neutral-800 rounded-xl text-neutral-600 text-sm">
                            No version timeline events recorded. <br />
                            <span className="mt-2 inline-block">Run <code className="text-green-400 bg-green-950/30 px-2 py-1 rounded font-mono">dmx logs push</code> locally.</span>
                          </div>
                        )}
                        
                        {versionHistory
                          .filter(h => h.dev_id === selectedDev.id)
                          .map((entry, idx) => (
                            <div key={entry.id} className="relative pl-6 group">
                              {/* Timeline dot */}
                              <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-700 border-2 border-black group-hover:bg-white group-hover:shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all" />
                              
                              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 hover:border-neutral-600 transition">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2 text-white font-medium">
                                    <GitBranch className="w-4 h-4 text-neutral-400" />
                                    {entry.message}
                                  </div>
                                  <span className="text-xs text-neutral-500 font-mono">
                                    {new Date(entry.created_at).toLocaleString()}
                                  </span>
                                </div>
                                
                                {/* Diff summary tags */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {(entry.changes?.added?.length ?? 0) > 0 && (
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-mono border border-green-500/20">
                                      +{entry.changes.added.length} added
                                    </span>
                                  )}
                                  {(entry.changes?.updated?.length ?? 0) > 0 && (
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
                                      ~{entry.changes.updated.length} updated
                                    </span>
                                  )}
                                  {(entry.changes?.removed?.length ?? 0) > 0 && (
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-mono border border-red-500/20">
                                      -{entry.changes.removed.length} removed
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-neutral-500 border border-dashed border-neutral-800 rounded-2xl bg-black/40">
                <Database className="w-12 h-12 text-neutral-800 mb-4" />
                <p>Select a node to inspect its environment state</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
