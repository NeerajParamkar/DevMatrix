export type Dependency = {
  name: string;
  version: string;
  latest: string;
  status: "up-to-date" | "outdated";
};

export type EnvVar = {
  key: string;
  value: string;
};

export type Log = {
  timestamp: string;
  message: string;
  type: "info" | "error" | "warn";
};

export type Developer = {
  id: string;
  name: string;
  status: "active" | "offline";
  lastActive: string;
  syncedFrom?: string;
  dependencies: Dependency[];
  envVars: EnvVar[];
  envLastUpdatedBy?: string;
  envLastUpdatedAt?: string;
  logs: Log[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: "active" | "idle";
  lastUpdated: string;
  developers: Developer[];
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-78a2f",
    name: "Astra Core Backend",
    description: "Main API gateway and microservices routing",
    status: "active",
    lastUpdated: "Just now",
    developers: [
      {
        id: "dev-01",
        name: "Neeraj",
        status: "active",
        lastActive: "Just now",
        dependencies: [
          { name: "react", version: "18.2.0", latest: "18.2.0", status: "up-to-date" },
          { name: "express", version: "4.18.2", latest: "4.18.2", status: "up-to-date" },
          { name: "lodash", version: "4.17.21", latest: "4.17.21", status: "up-to-date" },
        ],
        envVars: [
          { key: "API_KEY", value: "sk-live-************89A2" },
          { key: "DB_HOST", value: "db-prod.internal.astra.dev" },
          { key: "PORT", value: "8080" },
        ],
        envLastUpdatedBy: "Neeraj",
        envLastUpdatedAt: "10 mins ago",
        logs: [
          { timestamp: "10:21:01", message: "Server started on port 8080", type: "info" },
          { timestamp: "10:21:05", message: "Database connection established", type: "info" },
          { timestamp: "10:25:33", message: "API hit /users - 200 OK", type: "info" },
        ]
      },
      {
        id: "dev-02",
        name: "Rahul",
        status: "offline",
        lastActive: "2 hours ago",
        syncedFrom: "Neeraj",
        dependencies: [
          { name: "react", version: "17.0.2", latest: "18.2.0", status: "outdated" },
          { name: "express", version: "4.18.2", latest: "4.18.2", status: "up-to-date" },
          { name: "lodash", version: "4.16.0", latest: "4.17.21", status: "outdated" },
        ],
        envVars: [
          { key: "API_KEY", value: "sk-live-************89A2" },
          { key: "DB_HOST", value: "localhost" },
          { key: "PORT", value: "3000" },
        ],
        envLastUpdatedBy: "Rahul",
        envLastUpdatedAt: "1 day ago",
        logs: [
          { timestamp: "08:15:00", message: "Local Dev Matrix sync initiated", type: "info" },
          { timestamp: "08:15:45", message: "Warning: React version mismatch detected", type: "warn" },
          { timestamp: "08:30:12", message: "Connection closed unexpectedly", type: "error" },
        ]
      }
    ]
  },
  {
    id: "proj-x99zb",
    name: "Frontend Pulse",
    description: "Next.js dashboard application",
    status: "idle",
    lastUpdated: "5 hours ago",
    developers: [
      {
        id: "dev-03",
        name: "Anush",
        status: "offline",
        lastActive: "Yesterday",
        dependencies: [
          { name: "next", version: "14.1.0", latest: "14.1.0", status: "up-to-date" },
          { name: "tailwindcss", version: "3.4.1", latest: "3.4.1", status: "up-to-date" },
        ],
        envVars: [
          { key: "NEXT_PUBLIC_API_URL", value: "https://api.astra.dev" },
        ],
        envLastUpdatedBy: "Neeraj",
        envLastUpdatedAt: "2 hours ago",
        logs: [
          { timestamp: "Yesterday 18:00", message: "Build completed successfully", type: "info" },
        ]
      }
    ]
  }
];
