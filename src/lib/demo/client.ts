/**
 * Cliente que imita a API encadeável do supabase-js, mas lendo e gravando no
 * banco local do modo demo. Implementa só o que as telas do app usam:
 * select / eq / order / limit / single / maybeSingle / insert / update /
 * upsert / delete / count.
 */

import {
  buildRow,
  getStore,
  isDuplicate,
  persist,
  tableRows,
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
  DEMO_USER_NAME,
  type DemoRow,
} from "./store";

type Op = "select" | "insert" | "update" | "delete" | "upsert";
type FilterOp = "eq" | "neq" | "in" | "gt" | "gte" | "lt" | "lte" | "is" | "like";

type Filter = { column: string; op: FilterOp; value: unknown };
type Ordering = { column: string; ascending: boolean };

export type DemoResult = {
  data: DemoRow[] | DemoRow | null;
  error: { message: string } | null;
  count: number | null;
};

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function matchFilter(row: DemoRow, filter: Filter): boolean {
  const value = row[filter.column];
  switch (filter.op) {
    case "eq":
      return value === filter.value;
    case "neq":
      return value !== filter.value;
    case "in":
      return Array.isArray(filter.value) && filter.value.includes(value);
    case "gt":
      return compareValues(value, filter.value) > 0;
    case "gte":
      return compareValues(value, filter.value) >= 0;
    case "lt":
      return compareValues(value, filter.value) < 0;
    case "lte":
      return compareValues(value, filter.value) <= 0;
    case "is":
      return value === filter.value || (filter.value === null && value === undefined);
    case "like": {
      const pattern = String(filter.value ?? "")
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/%/g, ".*");
      return new RegExp(`^${pattern}$`, "i").test(String(value ?? ""));
    }
    default:
      return true;
  }
}

function parseColumns(columns: string | string[]): string[] | null {
  const list = Array.isArray(columns) ? columns : columns.split(",").map((c) => c.trim());
  const clean = list.filter((c) => c.length > 0 && !c.includes("("));
  if (clean.length === 0 || clean.includes("*")) return null;
  return clean;
}

function project(row: DemoRow, columns: string[] | null): DemoRow {
  if (!columns) return { ...row };
  const out: DemoRow = {};
  for (const column of columns) out[column] = row[column];
  return out;
}

class DemoQuery implements PromiseLike<DemoResult> {
  private filters: Filter[] = [];
  private orders: Ordering[] = [];
  private limitCount: number | null = null;
  private columns: string[] | null = null;
  private headOnly = false;
  private countMode: "none" | "exact" = "none";
  private singleMode: "none" | "single" | "maybeSingle" = "none";
  private payload: DemoRow[] = [];
  private conflictColumns: string[] = [];
  private returnRows = false;
  private operation: Op;

  constructor(
    private readonly table: string,
    operation: Op = "select",
  ) {
    this.operation = operation;
  }

  /* ----------------------------- leitura ----------------------------- */

  select(columns: string | string[] = "*", options?: { head?: boolean; count?: string }): this {
    this.columns = parseColumns(columns);
    this.headOnly = options?.head === true;
    if (options?.count) this.countMode = "exact";
    if (this.operation !== "select") this.returnRows = true;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, op: "neq", value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({ column, op: "in", value: values });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ column, op: "gt", value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ column, op: "gte", value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ column, op: "lt", value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ column, op: "lte", value });
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  like(column: string, pattern: string): this {
    this.filters.push({ column, op: "like", value: pattern });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orders.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.limitCount = to - from + 1;
    return this;
  }

  single(): this {
    this.singleMode = "single";
    return this;
  }

  maybeSingle(): this {
    this.singleMode = "maybeSingle";
    return this;
  }

  /* ----------------------------- escrita ----------------------------- */

  insert(values: DemoRow | DemoRow[]): this {
    this.operation = "insert";
    this.payload = Array.isArray(values) ? values.map((v) => ({ ...v })) : [{ ...values }];
    return this;
  }

  upsert(values: DemoRow | DemoRow[], options?: { onConflict?: string }): this {
    this.operation = "upsert";
    this.payload = Array.isArray(values) ? values.map((v) => ({ ...v })) : [{ ...values }];
    this.conflictColumns = (options?.onConflict ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    return this;
  }

  update(values: DemoRow): this {
    this.operation = "update";
    this.payload = [{ ...values }];
    return this;
  }

  delete(): this {
    this.operation = "delete";
    return this;
  }

  /* ----------------------------- execução ---------------------------- */

  private matched(): DemoRow[] {
    const rows = tableRows(this.table).filter((row) =>
      this.filters.every((filter) => matchFilter(row, filter)),
    );
    if (this.orders.length === 0) return rows;
    return [...rows].sort((a, b) => {
      for (const ordering of this.orders) {
        const result = compareValues(a[ordering.column], b[ordering.column]);
        if (result !== 0) return ordering.ascending ? result : -result;
      }
      return 0;
    });
  }

  private finish(rows: DemoRow[] | null, count: number | null): DemoResult {
    if (this.headOnly) return { data: null, error: null, count };

    if (this.singleMode === "single") {
      const first = rows?.[0];
      if (!first) {
        return { data: null, error: { message: "Nenhuma linha encontrada (modo demo)" }, count };
      }
      return { data: project(first, this.columns), error: null, count };
    }

    if (this.singleMode === "maybeSingle") {
      const first = rows?.[0];
      return { data: first ? project(first, this.columns) : null, error: null, count };
    }

    return {
      data: rows ? rows.map((row) => project(row, this.columns)) : null,
      error: null,
      count,
    };
  }

  private runSelect(): DemoResult {
    let rows = this.matched();
    const count = this.countMode === "exact" ? rows.length : null;
    if (this.limitCount !== null) rows = rows.slice(0, this.limitCount);
    return this.finish(rows, count);
  }

  private runInsert(): DemoResult {
    const rows = tableRows(this.table);
    const inserted: DemoRow[] = [];
    for (const payload of this.payload) {
      const row = buildRow(this.table, payload);
      if (isDuplicate(this.table, row)) continue;
      rows.push(row);
      inserted.push(row);
    }
    persist();
    return this.finish(this.returnRows ? inserted : null, inserted.length);
  }

  private runUpsert(): DemoResult {
    const rows = tableRows(this.table);
    const keys = this.conflictColumns.length > 0 ? this.conflictColumns : ["id"];
    const written: DemoRow[] = [];

    for (const payload of this.payload) {
      const existing = rows.find((row) => keys.every((key) => row[key] === payload[key]));
      if (existing) {
        Object.assign(existing, payload);
        written.push(existing);
      } else {
        const row = buildRow(this.table, payload);
        rows.push(row);
        written.push(row);
      }
    }
    persist();
    return this.finish(this.returnRows ? written : null, written.length);
  }

  private runUpdate(): DemoResult {
    const targets = this.matched();
    const patch = this.payload[0] ?? {};
    for (const row of targets) Object.assign(row, patch);
    persist();
    return this.finish(this.returnRows ? targets : null, targets.length);
  }

  private runDelete(): DemoResult {
    const targets = this.matched();
    getStore()[this.table] = tableRows(this.table).filter((row) => !targets.includes(row));
    persist();
    return this.finish(this.returnRows ? targets : null, targets.length);
  }

  private execute(): DemoResult {
    switch (this.operation) {
      case "insert":
        return this.runInsert();
      case "upsert":
        return this.runUpsert();
      case "update":
        return this.runUpdate();
      case "delete":
        return this.runDelete();
      default:
        return this.runSelect();
    }
  }

  then<TResult1 = DemoResult, TResult2 = never>(
    onfulfilled?: ((value: DemoResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

/* ------------------------------- auth -------------------------------- */

const demoUser = {
  id: DEMO_USER_ID,
  email: DEMO_USER_EMAIL,
  user_metadata: { display_name: DEMO_USER_NAME },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

const demoSession = {
  access_token: "demo-token",
  refresh_token: "demo-refresh",
  expires_in: 3600,
  token_type: "bearer",
  user: demoUser,
};

const demoAuth = {
  getUser: async () => ({ data: { user: demoUser }, error: null }),
  getSession: async () => ({ data: { session: demoSession }, error: null }),
  signInWithPassword: async () => ({ data: { user: demoUser, session: demoSession }, error: null }),
  signUp: async () => ({ data: { user: demoUser, session: demoSession }, error: null }),
  setSession: async () => ({ data: { user: demoUser, session: demoSession }, error: null }),
  refreshSession: async () => ({ data: { session: demoSession, user: demoUser }, error: null }),
  signOut: async () => ({ error: null }),
  onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
    const timer = setTimeout(() => callback("SIGNED_IN", demoSession), 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => clearTimeout(timer),
        },
      },
    };
  },
};

export const demoClient = {
  from: (table: string) => new DemoQuery(table),
  auth: demoAuth,
};
