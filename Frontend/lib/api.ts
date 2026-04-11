/**
 * Data fetching API for DMX Dashboard.
 * All functions map directly to the Supabase tables populated by the CLI.
 */

import { supabase } from './supabase';

// ─── Types (matching CLI's DeveloperDocument shape) ───────────────────────────

export type DependencyMap = Record<string, string>;

export type DependencyChange = {
  name: string;
  oldVersion: string;
  newVersion: string;
};

export type DependencyDiff = {
  added: string[];
  updated: DependencyChange[];
  removed: string[];
};

export type Developer = {
  id: string;
  project_id: string;
  name: string;
  dependencies: DependencyMap;
  env_keys: Record<string, string>;
  last_active: string;
  synced_from: string | null;
};

export type Project = {
  id: string;
  name: string;
  org_id: string;
  created_at: string;
  developers?: Developer[];
};

export type ProjectLatestState = {
  project_id: string;
  dependencies: DependencyMap;
  updated_by: string;
  updated_by_name: string;
  updated_at: string;
};

export type VersionHistoryEntry = {
  id: string;
  project_id: string;
  dev_id: string;
  dev_name: string;
  message: string;
  changes: DependencyDiff;
  full_deps: DependencyMap;
  created_at: string;
};

export type Notification = {
  id: string;
  project_id: string;
  message: string;
  changes: DependencyDiff;
  created_at: string;
};

// ─── Projects ─────────────────────────────────────────────────────────────────

/** Fetch all projects visible in the dashboard. */
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`getProjects: ${error.message}`);
  return data ?? [];
}

/** Get a single project by ID. */
export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`getProject: ${error.message}`);
  return data;
}

/** Create a new project row (called when user creates one in the UI). */
export async function createProject(id: string, name: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ id, name })
    .select()
    .single();

  if (error) throw new Error(`createProject: ${error.message}`);
  return data;
}

// ─── Developers ───────────────────────────────────────────────────────────────

/** Fetch all developers registered for a project. */
export async function getDevelopers(projectId: string): Promise<Developer[]> {
  const { data, error } = await supabase
    .from('developers')
    .select('*')
    .eq('project_id', projectId)
    .order('last_active', { ascending: false });

  if (error) throw new Error(`getDevelopers: ${error.message}`);
  return data ?? [];
}

// ─── Project Latest State ─────────────────────────────────────────────────────

/** Get the official latest dependency state for a project. */
export async function getProjectState(projectId: string): Promise<ProjectLatestState | null> {
  const { data, error } = await supabase
    .from('project_latest_state')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) throw new Error(`getProjectState: ${error.message}`);
  return data;
}

// ─── Version History ──────────────────────────────────────────────────────────

/** Get the version change timeline for a project (all developers). */
export async function getVersionHistory(
  projectId: string,
  limit = 50
): Promise<VersionHistoryEntry[]> {
  const { data, error } = await supabase
    .from('version_history')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getVersionHistory: ${error.message}`);
  return data ?? [];
}

/** Get the version history for a specific developer. */
export async function getDevVersionHistory(
  projectId: string,
  devId: string,
  limit = 20
): Promise<VersionHistoryEntry[]> {
  const { data, error } = await supabase
    .from('version_history')
    .select('*')
    .eq('project_id', projectId)
    .eq('dev_id', devId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getDevVersionHistory: ${error.message}`);
  return data ?? [];
}

// ─── Notifications ────────────────────────────────────────────────────────────

/** Get recent team notifications for a project. */
export async function getNotifications(
  projectId: string,
  limit = 20
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getNotifications: ${error.message}`);
  return data ?? [];
}

// ─── Real-time subscriptions ──────────────────────────────────────────────────

/**
 * Subscribe to real-time updates on the version_history table for a project.
 * Returns the subscription channel — call channel.unsubscribe() to clean up.
 */
export function subscribeToVersionHistory(
  projectId: string,
  onInsert: (entry: VersionHistoryEntry) => void
) {
  return supabase
    .channel(`version_history:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'version_history',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => onInsert(payload.new as VersionHistoryEntry)
    )
    .subscribe();
}

/**
 * Subscribe to real-time developer presence changes.
 */
export function subscribeToDevelopers(
  projectId: string,
  onChange: (developer: Developer) => void
) {
  return supabase
    .channel(`developers:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'developers',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => onChange(payload.new as Developer)
    )
    .subscribe();
}
