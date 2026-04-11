"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProjects, createProject, Project } from "@/lib/api";
import { Card, Badge, Button, Input } from "@/components/ui";
import { Plus, Copy, CheckCircle2, Users, Clock, RefreshCw } from "lucide-react";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [generatedId, setGeneratedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Load real projects from Supabase on mount
  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateProject = async () => {
    const id = `proj-${Math.random().toString(36).substring(2, 7)}`;
    setGeneratedId(id);
    try {
      const created = await createProject(id, newProject.name);
      setProjects([created, ...projects]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Environments</h1>
          <p className="text-neutral-400 mt-1">Manage project dependencies and developer sync status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={loadProjects} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Project
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-800 bg-red-950/30 text-red-400 text-sm p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-neutral-500 text-sm py-8 text-center">Loading projects from database…</div>
      )}

      {/* Empty state */}
      {!loading && !error && projects.length === 0 && (
        <div className="text-neutral-500 text-sm py-12 text-center border border-dashed border-neutral-800 rounded-xl">
          No projects yet. Create one and run <code className="text-green-400">dmx add dev &lt;id&gt;</code> to get started.
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link href={`/project/${project.id}`} key={project.id}>
              <Card className="p-6 hover:border-neutral-700 transition-colors cursor-pointer group flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
                      <span className="font-mono bg-neutral-900 px-1.5 py-0.5 rounded text-xs">{project.id}</span>
                    </div>
                  </div>
                  <Badge variant="outline">active</Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-neutral-500 pt-4 border-t border-white/10 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Developers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-black border-neutral-800 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>

            {!generatedId ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Project Name</label>
                  <Input
                    value={newProject.name}
                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g. Astro Backend"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateProject} disabled={!newProject.name}>Generate Project</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-center">Project Created Successfully!</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
                  <p className="text-sm text-neutral-400 mb-2">Run this command to initialize:</p>
                  <div className="flex items-center justify-between bg-black p-2 rounded border border-neutral-800">
                    <code className="text-sm text-green-400 font-mono">dmx add dev {generatedId}</code>
                    <button onClick={() => copyToClipboard(`dmx add dev ${generatedId}`)} className="text-neutral-500 hover:text-white p-1">
                      {copiedText === `dmx add dev ${generatedId}` ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => { setIsModalOpen(false); setGeneratedId(""); setNewProject({ name: "", description: "" }); }}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
