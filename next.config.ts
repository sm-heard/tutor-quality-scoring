import type { NextConfig } from "next"

const tracedFiles = [
  "./.data/app.db",
  "./.data/app.db-shm",
  "./.data/app.db-wal",
]

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/dashboard": tracedFiles,
    "/sessions": tracedFiles,
    "/tutors": tracedFiles,
    "/tutors/[tutorId]": tracedFiles,
    "/api/export/tutors.csv": tracedFiles,
    "/api/export/sessions.csv": tracedFiles,
  },
}

export default nextConfig
