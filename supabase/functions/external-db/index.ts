import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCHEMA = "mentoring";

// Lazy singleton pool — reused across requests on the same isolate
let _pool: Pool | null = null;

function getPool() {
  if (_pool) return _pool;

  const strip = (v: string | undefined) => v?.replace(/^=/, "") || "";
  const host = strip(Deno.env.get("POSTGRESQL_HOST"));
  const port = strip(Deno.env.get("POSTGRESQL_PORT"));
  const user = strip(Deno.env.get("POSTGRESQL_USER"));
  const password = strip(Deno.env.get("POSTGRESQL_PASSWORD"));
  const database = strip(Deno.env.get("POSTGRESQL_DBNAME"));

  console.log("DB connection config:", { host, port, user, database, hasPwd: !!password });

  if (!host || !user || !password || !database) {
    throw new Error("External DB credentials not configured");
  }

  _pool = new Pool(
    {
      hostname: host,
      port: parseInt(port || "5432"),
      user,
      password,
      database,
      tls: { enabled: false },
    },
    3,
    true
  );
  return _pool;
}

// Helper to get authenticated user from Supabase JWT
async function getUser(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        apikey: supabaseKey,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id || null;
  } catch {
    return null;
  }
}

// Check admin role via Supabase (not external DB)
async function isAdmin(req: Request, userId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) return false;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.super_admin&select=role`,
      {
        headers: {
          Authorization: authHeader,
          apikey: supabaseKey,
        },
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = req.method === "POST" ? await req.json() : {};

    // Setup doesn't require authentication
    if (action === "setup") {
      const pool = getPool();
      const conn = await pool.connect();

      try {
        const ddl = `
          CREATE SCHEMA IF NOT EXISTS ${SCHEMA};

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.goals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            title TEXT NOT NULL,
            amount TEXT,
            has_amount BOOLEAN NOT NULL DEFAULT false,
            progress INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            session_number INTEGER NOT NULL,
            session_date TEXT NOT NULL,
            session_time TEXT NOT NULL,
            summary TEXT NOT NULL DEFAULT '',
            steps TEXT[] DEFAULT '{}',
            files TEXT[] DEFAULT '{}',
            gradient TEXT NOT NULL DEFAULT 'from-lime to-lime-dark',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.protocols (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            icon TEXT NOT NULL DEFAULT 'zap',
            color TEXT NOT NULL DEFAULT 'amber',
            file_name TEXT NOT NULL DEFAULT '',
            file_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.roadmaps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'В работе',
            file_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.roadmap_steps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            roadmap_id UUID NOT NULL REFERENCES ${SCHEMA}.roadmaps(id) ON DELETE CASCADE,
            text TEXT NOT NULL,
            done BOOLEAN NOT NULL DEFAULT false,
            deadline DATE,
            sort_order INTEGER NOT NULL DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.volcanoes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            value INTEGER NOT NULL DEFAULT 0,
            comment TEXT NOT NULL DEFAULT ''
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.progress_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            metric_key TEXT NOT NULL,
            label TEXT NOT NULL,
            current_value INTEGER NOT NULL DEFAULT 0,
            previous_value INTEGER NOT NULL DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.route_info (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            sessions_total INTEGER NOT NULL DEFAULT 8,
            sessions_done INTEGER NOT NULL DEFAULT 0,
            time_weeks INTEGER NOT NULL DEFAULT 12,
            resources TEXT[] DEFAULT '{}'
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.diary_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            entry_type TEXT NOT NULL DEFAULT 'daily',
            entry_date TEXT NOT NULL,
            energy INTEGER,
            text TEXT,
            intent TEXT,
            achievements TEXT,
            lessons TEXT,
            next_step TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.tracking_questions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            question_type TEXT NOT NULL DEFAULT 'daily',
            question_text TEXT NOT NULL,
            field_type TEXT NOT NULL DEFAULT 'text',
            sort_order INTEGER NOT NULL DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.point_b_questions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            question_text TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.point_b_answers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            question_id UUID NOT NULL,
            answer_text TEXT NOT NULL DEFAULT ''
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.point_b_results (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            achieved TEXT NOT NULL DEFAULT '',
            analysis TEXT NOT NULL DEFAULT '',
            not_achieved TEXT NOT NULL DEFAULT ''
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE,
            email TEXT NOT NULL DEFAULT '',
            full_name TEXT NOT NULL DEFAULT '',
            avatar_url TEXT,
            is_blocked BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          CREATE TABLE IF NOT EXISTS ${SCHEMA}.user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE,
            role TEXT NOT NULL DEFAULT 'user'
          );

          -- Add unique constraints if not exist
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_volcanoes_user_name') THEN
              ALTER TABLE ${SCHEMA}.volcanoes ADD CONSTRAINT uq_volcanoes_user_name UNIQUE (user_id, name);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_metrics_user_key') THEN
              ALTER TABLE ${SCHEMA}.progress_metrics ADD CONSTRAINT uq_metrics_user_key UNIQUE (user_id, metric_key);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_route_user') THEN
              ALTER TABLE ${SCHEMA}.route_info ADD CONSTRAINT uq_route_user UNIQUE (user_id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_pb_answers_user_q') THEN
              ALTER TABLE ${SCHEMA}.point_b_answers ADD CONSTRAINT uq_pb_answers_user_q UNIQUE (user_id, question_id);
            END IF;
          END $$;
        `;
        await conn.queryArray(ddl);
        const result = { success: true, message: "Schema created" };
        conn.release();
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error: unknown) {
        conn.release();
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Setup error:", message);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // All other actions require authentication
    const userId = await getUser(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== BATCH: execute multiple queries in one connection =====
    if (action === "batch") {
      const { queries } = body;
      if (!Array.isArray(queries) || queries.length === 0) {
        return new Response(JSON.stringify({ error: "queries must be a non-empty array" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const allowedTables = [
        "goals", "sessions", "protocols", "roadmaps", "roadmap_steps",
        "volcanoes", "progress_metrics", "route_info", "diary_entries",
        "tracking_questions", "point_b_questions", "point_b_answers",
        "point_b_results", "profiles", "user_roles",
      ];

      const pool = getPool();
      const conn = await pool.connect();
      try {
        const results: any[] = [];
        for (const q of queries) {
          const { action: qAction, table, filters, order, single, withSteps } = q;
          if (qAction !== "select") {
            results.push({ error: "batch only supports select" });
            continue;
          }
          if (!allowedTables.includes(table)) {
            results.push({ error: `Table not allowed: ${table}` });
            continue;
          }

          let query = `SELECT * FROM ${SCHEMA}.${table}`;
          const params: any[] = [];
          const conditions: string[] = [];
          let paramIdx = 1;

          if (filters) {
            for (const [col, val] of Object.entries(filters)) {
              conditions.push(`${col} = $${paramIdx}`);
              params.push(val);
              paramIdx++;
            }
          }
          if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
          }
          if (order) {
            const dir = order.ascending === false ? "DESC" : "ASC";
            query += ` ORDER BY ${order.column} ${dir}`;
          }

          const res = await conn.queryObject(query, params);
          let data: any = single ? (res.rows[0] || null) : res.rows;

          // roadmaps with steps join
          if (table === "roadmaps" && withSteps && Array.isArray(data) && data.length > 0) {
            const roadmapIds = data.map((r: any) => r.id);
            const placeholders = roadmapIds.map((_: any, i: number) => `$${i + 1}`).join(",");
            const stepsRes = await conn.queryObject(
              `SELECT * FROM ${SCHEMA}.roadmap_steps WHERE roadmap_id IN (${placeholders}) ORDER BY sort_order`,
              roadmapIds
            );
            const stepsMap: Record<string, any[]> = {};
            for (const step of stepsRes.rows as any[]) {
              if (!stepsMap[step.roadmap_id]) stepsMap[step.roadmap_id] = [];
              stepsMap[step.roadmap_id].push(step);
            }
            data = data.map((r: any) => ({ ...r, roadmap_steps: stepsMap[r.id] || [] }));
          }

          results.push({ data });
        }
        conn.release();
        return new Response(JSON.stringify({ results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error: unknown) {
        conn.release();
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Batch error:", message);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const pool = getPool();
    const conn = await pool.connect();

    try {
      let result: any;

      switch (action) {
        // ===== SELECT =====
        case "select": {
          const { table, filters, order, single } = body;
          const allowedTables = [
            "goals", "sessions", "protocols", "roadmaps", "roadmap_steps",
            "volcanoes", "progress_metrics", "route_info", "diary_entries",
            "tracking_questions", "point_b_questions", "point_b_answers",
            "point_b_results", "profiles", "user_roles",
          ];
          if (!allowedTables.includes(table)) {
            throw new Error(`Table not allowed: ${table}`);
          }

          let query = `SELECT * FROM ${SCHEMA}.${table}`;
          const params: any[] = [];
          const conditions: string[] = [];
          let paramIdx = 1;

          if (filters) {
            for (const [col, val] of Object.entries(filters)) {
              conditions.push(`${col} = $${paramIdx}`);
              params.push(val);
              paramIdx++;
            }
          }

          if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
          }

          if (order) {
            const dir = order.ascending === false ? "DESC" : "ASC";
            query += ` ORDER BY ${order.column} ${dir}`;
          }

          const res = await conn.queryObject(query, params);
          
          if (single) {
            result = { data: res.rows[0] || null };
          } else {
            result = { data: res.rows };
          }

          // Special case: roadmaps with steps join
          if (table === "roadmaps" && body.withSteps) {
            const roadmapIds = (result.data as any[]).map((r: any) => r.id);
            if (roadmapIds.length > 0) {
              const placeholders = roadmapIds.map((_: any, i: number) => `$${i + 1}`).join(",");
              const stepsRes = await conn.queryObject(
                `SELECT * FROM ${SCHEMA}.roadmap_steps WHERE roadmap_id IN (${placeholders}) ORDER BY sort_order`,
                roadmapIds
              );
              const stepsMap: Record<string, any[]> = {};
              for (const step of stepsRes.rows as any[]) {
                if (!stepsMap[step.roadmap_id]) stepsMap[step.roadmap_id] = [];
                stepsMap[step.roadmap_id].push(step);
              }
              result.data = (result.data as any[]).map((r: any) => ({
                ...r,
                roadmap_steps: stepsMap[r.id] || [],
              }));
            }
          }
          break;
        }

        // ===== INSERT =====
        case "insert": {
          const { table, data: insertData } = body;
          const row = { ...insertData, user_id: userId };
          const cols = Object.keys(row);
          const vals = Object.values(row);
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");

          const res = await conn.queryObject(
            `INSERT INTO ${SCHEMA}.${table} (${cols.join(", ")}) VALUES (${placeholders}) RETURNING *`,
            vals
          );
          result = { data: res.rows[0] };
          break;
        }

        // ===== UPDATE =====
        case "update": {
          const { table, data: updateData, match } = body;
          const setClauses: string[] = [];
          const params: any[] = [];
          let idx = 1;

          for (const [col, val] of Object.entries(updateData)) {
            setClauses.push(`${col} = $${idx}`);
            params.push(val);
            idx++;
          }

          const conditions: string[] = [];
          for (const [col, val] of Object.entries(match || {})) {
            conditions.push(`${col} = $${idx}`);
            params.push(val);
            idx++;
          }

          // Always scope to user
          conditions.push(`user_id = $${idx}`);
          params.push(userId);

          const res = await conn.queryObject(
            `UPDATE ${SCHEMA}.${table} SET ${setClauses.join(", ")} WHERE ${conditions.join(" AND ")} RETURNING *`,
            params
          );
          result = { data: res.rows[0] };
          break;
        }

        // ===== UPSERT =====
        case "upsert": {
          const { table, data: upsertData, onConflict } = body;
          const row = { ...upsertData, user_id: userId };
          const cols = Object.keys(row);
          const vals = Object.values(row);
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");

          const updateCols = cols
            .filter((c) => !onConflict.split(",").map((s: string) => s.trim()).includes(c))
            .map((c) => `${c} = EXCLUDED.${c}`)
            .join(", ");

          const res = await conn.queryObject(
            `INSERT INTO ${SCHEMA}.${table} (${cols.join(", ")}) VALUES (${placeholders})
             ON CONFLICT (${onConflict}) DO UPDATE SET ${updateCols} RETURNING *`,
            vals
          );
          result = { data: res.rows[0] };
          break;
        }

        // ===== DELETE =====
        case "delete": {
          const { table, match } = body;
          const conditions: string[] = [];
          const params: any[] = [];
          let idx = 1;

          for (const [col, val] of Object.entries(match || {})) {
            conditions.push(`${col} = $${idx}`);
            params.push(val);
            idx++;
          }

          conditions.push(`user_id = $${idx}`);
          params.push(userId);

          await conn.queryObject(
            `DELETE FROM ${SCHEMA}.${table} WHERE ${conditions.join(" AND ")}`,
            params
          );
          result = { success: true };
          break;
        }

        // ===== ADMIN SELECT (for super_admin) =====
        case "admin_select": {
          if (!(await isAdmin(req, userId))) {
            throw new Error("Forbidden: not an admin");
          }

          const { table, filters, order } = body;
          let query = `SELECT * FROM ${SCHEMA}.${table}`;
          const params: any[] = [];
          const conditions: string[] = [];
          let paramIdx = 1;

          if (filters) {
            for (const [col, val] of Object.entries(filters)) {
              conditions.push(`${col} = $${paramIdx}`);
              params.push(val);
              paramIdx++;
            }
          }

          if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
          }

          if (order) {
            const dir = order.ascending === false ? "DESC" : "ASC";
            query += ` ORDER BY ${order.column} ${dir}`;
          }

          const res = await conn.queryObject(query, params);
          result = { data: res.rows };

          if (table === "roadmaps" && body.withSteps) {
            const roadmapIds = (result.data as any[]).map((r: any) => r.id);
            if (roadmapIds.length > 0) {
              const placeholders = roadmapIds.map((_: any, i: number) => `$${i + 1}`).join(",");
              const stepsRes = await conn.queryObject(
                `SELECT * FROM ${SCHEMA}.roadmap_steps WHERE roadmap_id IN (${placeholders}) ORDER BY sort_order`,
                roadmapIds
              );
              const stepsMap: Record<string, any[]> = {};
              for (const step of stepsRes.rows as any[]) {
                if (!stepsMap[step.roadmap_id]) stepsMap[step.roadmap_id] = [];
                stepsMap[step.roadmap_id].push(step);
              }
              result.data = (result.data as any[]).map((r: any) => ({
                ...r,
                roadmap_steps: stepsMap[r.id] || [],
              }));
            }
          }
          break;
        }

        // ===== ADMIN UPDATE =====
        case "admin_update": {
          if (!(await isAdmin(req, userId))) {
            throw new Error("Forbidden: not an admin");
          }

          const { table, data: updateData, match } = body;
          const setClauses: string[] = [];
          const params: any[] = [];
          let idx = 1;

          for (const [col, val] of Object.entries(updateData)) {
            setClauses.push(`${col} = $${idx}`);
            params.push(val);
            idx++;
          }

          const conditions: string[] = [];
          for (const [col, val] of Object.entries(match || {})) {
            conditions.push(`${col} = $${idx}`);
            params.push(val);
            idx++;
          }

          const res = await conn.queryObject(
            `UPDATE ${SCHEMA}.${table} SET ${setClauses.join(", ")} WHERE ${conditions.join(" AND ")} RETURNING *`,
            params
          );
          result = { data: res.rows[0] };
          break;
        }

        // ===== ADMIN INSERT =====
        case "admin_insert": {
          if (!(await isAdmin(req, userId))) {
            throw new Error("Forbidden: not an admin");
          }

          const { table, data: insertData } = body;
          const cols = Object.keys(insertData);
          const vals = Object.values(insertData);
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");

          const res = await conn.queryObject(
            `INSERT INTO ${SCHEMA}.${table} (${cols.join(", ")}) VALUES (${placeholders}) RETURNING *`,
            vals
          );
          result = { data: res.rows[0] };
          break;
        }

        // ===== ADMIN DELETE =====
        case "admin_delete": {
          if (!(await isAdmin(req, userId))) {
            throw new Error("Forbidden: not an admin");
          }

          const { table, match } = body;
          const conditions: string[] = [];
          const params: any[] = [];
          let idx = 1;

          for (const [col, val] of Object.entries(match || {})) {
            conditions.push(`${col} = $${idx}`);
            params.push(val);
            idx++;
          }

          await conn.queryObject(
            `DELETE FROM ${SCHEMA}.${table} WHERE ${conditions.join(" AND ")}`,
            params
          );
          result = { success: true };
          break;
        }

        // ===== ADMIN UPSERT =====
        case "admin_upsert": {
          if (!(await isAdmin(req, userId))) {
            throw new Error("Forbidden: not an admin");
          }

          const { table, data: upsertData, onConflict } = body;
          const cols = Object.keys(upsertData);
          const vals = Object.values(upsertData);
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");

          const updateCols = cols
            .filter((c) => !onConflict.split(",").map((s: string) => s.trim()).includes(c))
            .map((c) => `${c} = EXCLUDED.${c}`)
            .join(", ");

          const res = await conn.queryObject(
            `INSERT INTO ${SCHEMA}.${table} (${cols.join(", ")}) VALUES (${placeholders})
             ON CONFLICT (${onConflict}) DO UPDATE SET ${updateCols} RETURNING *`,
            vals
          );
          result = { data: res.rows[0] };
          break;
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } finally {
      conn.release();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("External DB error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
