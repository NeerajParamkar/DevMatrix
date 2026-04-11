"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Terminal, Plus, UserPlus, Loader2, Copy, CheckCircle2, ChevronRight } from "lucide-react";

type Step = "choose" | "create" | "join" | "done";
type DonePayload = { role: "admin" | "developer"; orgName: string; orgId: string };

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Create team state
  const [orgName, setOrgName] = useState("");

  // Join team state
  const [inviteCode, setInviteCode] = useState("");

  // Done state
  const [done, setDone] = useState<DonePayload | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Check if user already has an org membership → redirect
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("organization_members")
      .select("role, organizations(id, name)")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const role = data.role as "admin" | "developer";
          window.location.href = role === "admin" ? "/admin" : "/dashboard";
        }
      });
  }, [userId]);

  // ── Create Organization ─────────────────────────────────
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      // Generate short invite code
      const invCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orgId = `org-${Math.random().toString(36).substring(2, 9)}`;

      // Insert organization
      const { error: orgErr } = await supabase
        .from("organizations")
        .insert({ id: orgId, name: orgName, owner_id: userId, invite_code: invCode });
      if (orgErr) throw new Error(orgErr.message);

      // Add user as admin member
      const { error: memErr } = await supabase
        .from("organization_members")
        .insert({ org_id: orgId, user_id: userId, role: "admin" });
      if (memErr) throw new Error(memErr.message);

      setDone({ role: "admin", orgName, orgId });
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Join Organization ──────────────────────────────────
  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      // Find org by invite code
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("invite_code", inviteCode.toUpperCase().trim())
        .maybeSingle();

      if (orgErr) throw new Error(orgErr.message);
      if (!org) throw new Error("Invalid invite code. Please double-check with your Admin.");

      // Check not already a member
      const { data: existing } = await supabase
        .from("organization_members")
        .select("role")
        .eq("org_id", org.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Already a member — just redirect
        window.location.href = existing.role === "admin" ? "/admin" : "/dashboard";
        return;
      }

      // Add as developer
      const { error: memErr } = await supabase
        .from("organization_members")
        .insert({ org_id: org.id, user_id: userId, role: "developer" });
      if (memErr) throw new Error(memErr.message);

      setDone({ role: "developer", orgName: org.name, orgId: org.id });
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">DevMatrix</span>
        </div>

        {/* Step: Choose */}
        {step === "choose" && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold mb-1">Set up your workspace</h1>
            <p className="text-neutral-400 text-sm mb-8">Do you want to create a new team or join an existing one?</p>

            <div className="space-y-4">
              <button
                onClick={() => setStep("create")}
                className="w-full flex items-center justify-between p-5 rounded-xl border border-neutral-700 bg-neutral-900 hover:border-neutral-500 hover:bg-neutral-800 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Create a new team</p>
                    <p className="text-sm text-neutral-400">You&apos;ll become the Admin and can invite developers</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
              </button>

              <button
                onClick={() => setStep("join")}
                className="w-full flex items-center justify-between p-5 rounded-xl border border-neutral-700 bg-neutral-900 hover:border-neutral-500 hover:bg-neutral-800 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Join an existing team</p>
                    <p className="text-sm text-neutral-400">Enter an invite code from your team Admin</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Create Team */}
        {step === "create" && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
            <button onClick={() => setStep("choose")} className="text-sm text-neutral-500 hover:text-white mb-6 flex items-center gap-1 transition">
              ← Back
            </button>
            <h1 className="text-2xl font-bold mb-1">Create your team</h1>
            <p className="text-neutral-400 text-sm mb-6">You&apos;ll be the Admin. Invite developers after setup.</p>

            {error && <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-sm">{error}</div>}

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">Organization / Team Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  required
                  placeholder="e.g. Acme Engineering"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !orgName.trim()}
                className="w-full bg-white text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-neutral-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Team
              </button>
            </form>
          </div>
        )}

        {/* Step: Join Team */}
        {step === "join" && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
            <button onClick={() => setStep("choose")} className="text-sm text-neutral-500 hover:text-white mb-6 flex items-center gap-1 transition">
              ← Back
            </button>
            <h1 className="text-2xl font-bold mb-1">Join a team</h1>
            <p className="text-neutral-400 text-sm mb-6">Ask your team Admin for the invite code.</p>

            {error && <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-sm">{error}</div>}

            <form onSubmit={handleJoinOrg} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  required
                  placeholder="e.g. ABC123"
                  maxLength={10}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 transition tracking-widest"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="w-full bg-white text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-neutral-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Join Team
              </button>
            </form>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && done && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-1">You&apos;re all set!</h1>
            <p className="text-neutral-400 text-sm mb-2">
              {done.role === "admin"
                ? `You created the team "${done.orgName}" and are now its Admin.`
                : `You joined the team "${done.orgName}" as a Developer.`}
            </p>
            <p className="text-neutral-500 text-xs mb-8">Role: <span className="uppercase font-mono text-neutral-300">{done.role}</span></p>

            <button
              onClick={() => { window.location.href = done.role === "admin" ? "/admin" : "/dashboard"; }}
              className="w-full bg-white text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-neutral-200 transition"
            >
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
