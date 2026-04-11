"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getProjects, createProject, getDevelopers, Project } from "@/lib/api";
import { Terminal, Bell, LogOut, Settings, Shield, Copy, Plus, Users, Clock, RefreshCw, CheckCircle2, MessageSquare } from "lucide-react";

type OrgInfo = { id: string; name: string; invite_code: string };

export default function AdminDashboard() {
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "" });
  const [generatedId, setGeneratedId] = useState("");
  const [totalDevs, setTotalDevs] = useState(0);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserName(user.user_metadata?.full_name ?? user.email ?? "Admin");

    // Get org membership
    const { data: member } = await supabase
      .from("organization_members")
      .select("role, organizations(*)")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (member?.organizations) {
      const o = member.organizations as any;
      setOrg({ id: o.id, name: o.name, invite_code: o.invite_code });

      // Get projects for this org
      const { data: projs } = await supabase
        .from("projects")
        .select("*")
        .eq("org_id", o.id)
        .order("created_at", { ascending: false });
      setProjects(projs ?? []);

      // Count total devs across all projects
      let count = 0;
      for (const p of projs ?? []) {
        const devs = await getDevelopers(p.id);
        count += devs.length;
      }
      setTotalDevs(count);
    }
    setLoading(false);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const copyInviteCode = () => {
    if (!org) return;
    copyToClipboard(org.invite_code);
  };

  const handleCreateProject = async () => {
    if (!org) return;
    const id = `proj-${Math.random().toString(36).substring(2, 7)}`;
    setGeneratedId(id);
    try {
      await supabase.from("projects").insert({ id, name: newProject.name, org_id: org.id });
      await loadData();
    } catch (err: any) { console.error(err); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-neutral-400">
      Loading admin workspace…
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <Terminal className="h-6 w-6 text-white" />
            <span className="font-bold text-lg tracking-tight">DevMatrix</span>
            <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin
            </span>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Org Header + Invite Banner */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{org?.name ?? "Your Organization"}</h1>
            <p className="text-neutral-400 mt-1">{projects.length} project(s) · {totalDevs} developer(s) linked</p>
          </div>
          <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-5 py-3">
            <div>
              <p className="text-xs text-neutral-500 mb-0.5">Team Invite Code</p>
              <p className="font-mono font-bold text-lg tracking-widest text-white">{org?.invite_code}</p>
            </div>
            <button
              onClick={copyInviteCode}
              className="ml-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-neutral-300"
            >
              {copiedText === org?.invite_code ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Projects", value: projects.length, icon: Settings },
            { label: "Developers", value: totalDevs, icon: Users },
            { label: "Invite Code", value: org?.invite_code ?? "—", icon: Shield },
            { label: "Role", value: "Admin", icon: Shield },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2">
                <Icon className="w-4 h-4" />
                {label}
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Projects</h2>
            <div className="flex gap-2">
              <button onClick={loadData} className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200 transition"
              >
                <Plus className="w-4 h-4" /> New Project
              </button>
            </div>
          </div>

          {projects.length === 0 && (
            <div className="border border-dashed border-neutral-800 rounded-xl py-12 text-center text-neutral-600 text-sm">
              No projects yet. Create one and share the ID with your team.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(project => (
              <Link href={`/project/${project.id}`} key={project.id}>
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 hover:border-neutral-600 transition cursor-pointer">
                  <h3 className="font-semibold text-white mb-1">{project.name}</h3>
                  <div className="font-mono text-xs text-neutral-500 bg-black px-2 py-1 rounded mb-4 inline-block">{project.id}</div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center gap-1"><Users className="w-3 h-3" /> Developers</div>
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(project.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            {!generatedId ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-neutral-400 mb-1.5 block">Project Name</label>
                  <input
                    value={newProject.name}
                    onChange={e => setNewProject({ name: e.target.value })}
                    placeholder="e.g. Astro Backend"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition">Cancel</button>
                  <button onClick={handleCreateProject} disabled={!newProject.name} className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-neutral-200 transition disabled:opacity-50">Create</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <p className="font-medium">Project Created!</p>
                <div className="bg-black border border-neutral-800 rounded-lg p-3 flex items-center justify-between">
                  <code className="text-green-400 text-sm font-mono">dmx add dev {generatedId}</code>
                  <button onClick={() => copyToClipboard(`dmx add dev ${generatedId}`)}>
                    {copiedText === `dmx add dev ${generatedId}` ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-neutral-500" />}
                  </button>
                </div>
                <button onClick={() => { setIsModalOpen(false); setGeneratedId(""); setNewProject({ name: "" }); }} className="w-full bg-white text-black text-sm font-semibold rounded-lg py-2.5 hover:bg-neutral-200 transition">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
