# Technology and operations review

**Verdict: Accept for the hackathon MVP, with two required deployment clarifications.** The named stack is current and coherent for a small server-rendered web app. No replacement is needed.

## Findings

1. **Verified — Next.js 16.3.3 / Active LTS.** The Next.js security release names 16.3.3 as the Active LTS release. Keep the exact version governed by the lockfile, and update it promptly when security releases appear.
   - Source: <https://nextjs.org/blog>

2. **Verified — Next.js + Vercel is a suitable low-operations deployment.** Vercel documents zero-configuration Next.js deployment; Next.js also documents that a Node.js server supports all core features. Vercel is a sensible MVP default, not a platform dependency.
   - Sources: <https://vercel.com/docs/frameworks/full-stack/nextjs>, <https://nextjs.org/docs/app/getting-started/deploying>

3. **Verified — Supabase migrations in the repository are supported.** Supabase uses `supabase/migrations` and documents applying the committed migrations with `supabase db push`.
   - Source: <https://supabase.com/docs/guides/deployment/database-migrations>

4. **Required clarification — “no accounts; share only with the team” is a social rule, not access control.** A deployed Vercel URL can still be forwarded. This is acceptable only for non-sensitive hackathon data. Before real editorial work or a wider audience, add authentication *and* enforce database access with Row Level Security/grants. In the MVP, enable RLS and give `anon` no table privileges; let the server alone access the database with a secret key held only in deployment variables.
   - Sources: <https://supabase.com/docs/guides/database/postgres/row-level-security>, <https://supabase.com/docs/guides/getting-started/api-keys>

5. **Required clarification — the official Supabase quickstart is intentionally not a production-security recipe.** It explicitly asks deployers to review RLS and use deployment environment variables. The architecture's server-only secret rule is sound, but the implementation must not copy any public-read sample policy from the quickstart.
   - Source: <https://supabase.com/docs/guides/getting-started/quickstarts/nextjs>

