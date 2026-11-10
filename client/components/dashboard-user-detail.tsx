"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, LoaderCircle, Save, ShieldCheck, UserRound } from "lucide-react";

type UserRecord = { id: string; fullname: string; email: string; role: "ADMIN" | "USER"; createdAt: string; updatedAt: string; permissions: string[] | null };
type UserResponse = { message?: string; result?: UserRecord };
type Permission = { id: string; label: string };
type PermissionGroup = { title: string; items: Permission[] };

const permissionGroups: PermissionGroup[] = [
  { title: "Dashboard", items: [{ id: "dashboard.view", label: "View dashboard" }, { id: "analytics.view", label: "View analytics" }] },
  { title: "Products", items: [{ id: "products.view", label: "View" }, { id: "products.create", label: "Create" }, { id: "products.edit", label: "Edit" }, { id: "products.delete", label: "Delete" }] },
  { title: "Categories", items: [{ id: "categories.view", label: "View" }, { id: "categories.create", label: "Create" }, { id: "categories.edit", label: "Edit" }, { id: "categories.delete", label: "Delete" }] },
  { title: "Orders", items: [{ id: "orders.view", label: "View" }, { id: "orders.update", label: "Update" }, { id: "orders.delete", label: "Delete" }] },
  { title: "Customers", items: [{ id: "customers.view", label: "View customers" }] },
  { title: "Users & roles", items: [{ id: "users.view", label: "View users" }, { id: "users.manage", label: "Manage users and roles" }] },
  { title: "Settings", items: [{ id: "settings.manage", label: "Manage settings" }] },
];

const allPermissionIds = permissionGroups.flatMap((group) => group.items.map((item) => item.id));
const defaultUserPermissions = ["dashboard.view", "products.view", "categories.view", "orders.view", "customers.view"];
const apiBase = "/api";

function getToken() {
  const storedUser = window.localStorage.getItem("user-data");
  return storedUser ? (JSON.parse(storedUser) as { access_token?: string }).access_token ?? "" : "";
}

function initialPermissions(user: UserRecord) {
  if (user.role === "ADMIN") return allPermissionIds;
  if (Array.isArray(user.permissions)) return user.permissions.filter((permission) => allPermissionIds.includes(permission));
  return defaultUserPermissions;
}

export default function DashboardUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [savedPermissions, setSavedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/admin/users/${encodeURIComponent(id)}`, { cache: "no-store", headers: { Authorization: `Bearer ${getToken()}` } });
      const payload = (await response.json()) as UserResponse;
      if (!response.ok || !payload.result) throw new Error(payload.message ?? "User details could not be loaded.");
      const currentPermissions = initialPermissions(payload.result);
      setUser(payload.result);
      setPermissions(currentPermissions);
      setSavedPermissions(currentPermissions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The server could not be reached.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadUser(); }, [loadUser]);

  const isDirty = useMemo(() => JSON.stringify([...permissions].sort()) !== JSON.stringify([...savedPermissions].sort()), [permissions, savedPermissions]);
  const selectedCount = permissions.length;

  function togglePermission(permissionId: string) {
    setSavedMessage("");
    setPermissions((current) => current.includes(permissionId) ? current.filter((item) => item !== permissionId) : [...current, permissionId]);
  }

  async function savePermissions() {
    if (!isDirty) return;
    setIsSaving(true);
    setError("");
    setSavedMessage("");
    try {
      const response = await fetch(`${apiBase}/admin/users/${encodeURIComponent(id)}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ permissions }),
      });
      const payload = (await response.json()) as UserResponse;
      if (!response.ok || !payload.result) throw new Error(payload.message ?? "Permissions could not be saved.");
      setUser(payload.result);
      setSavedPermissions(permissions);
      setSavedMessage("Changes saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Permissions could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <main className="grid min-h-64 place-items-center p-8 text-slate-500"><LoaderCircle className="size-6 animate-spin" /></main>;
  if (error && !user) return <main className="space-y-4 p-4 sm:p-6 lg:p-8"><Link href="/dashbordmain/users-roles" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950"><ArrowLeft className="size-4" />Back to users</Link><p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p></main>;
  if (!user) return null;

  const initials = user.fullname.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();

  return (
    <main className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <Link href="/dashbordmain/users-roles" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"><ArrowLeft className="size-4" />Users</Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-100 font-medium text-slate-500">{initials || <UserRound className="size-5" />}</span><div><h1 className="text-3xl font-semibold tracking-tight text-slate-950">{user.fullname}</h1><p className="mt-1 text-slate-500">{user.email} · {user.role === "ADMIN" ? "Admin" : "User"}</p></div></div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"><ShieldCheck className="size-4" />Account</span>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,2fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Account details</h2><dl className="mt-4 space-y-4 text-sm"><Detail label="Email" value={user.email} /><Detail label="Role" value={user.role === "ADMIN" ? "Admin" : "User"} /><Detail label="Created" value={new Date(user.createdAt).toLocaleDateString()} /><Detail label="Last updated" value={new Date(user.updatedAt).toLocaleDateString()} /></dl></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Permissions</h2><p className="mt-1 text-sm text-slate-500">Choose which dashboard areas and actions this account can access.</p>{user.role === "ADMIN" && <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">Admins always have all permissions.</p>}<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3"><span className="text-sm text-slate-500">{selectedCount} of {allPermissionIds.length} permissions enabled</span>{user.role !== "ADMIN" && <button type="button" disabled={!isDirty || isSaving} onClick={() => void savePermissions()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Save changes</button>}</div>
          {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{savedMessage && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{savedMessage}</p>}
          <div className="mt-4 grid gap-3 md:grid-cols-2">{permissionGroups.map((group) => <section key={group.title} className="overflow-hidden rounded-xl border border-slate-200"><header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"><h3 className="font-semibold text-slate-800">{group.title}</h3><span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">{group.items.filter((item) => permissions.includes(item.id)).length} / {group.items.length}</span></header><div className="divide-y divide-slate-100">{group.items.map((item) => { const checked = permissions.includes(item.id); const changed = checked !== savedPermissions.includes(item.id); return <label key={item.id} className={`flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors ${user.role === "ADMIN" ? "cursor-default" : "cursor-pointer"} ${changed ? "bg-emerald-50/70" : "hover:bg-slate-50"}`}><span className="text-slate-800">{item.label}</span><input type="checkbox" checked={checked} disabled={user.role === "ADMIN"} onChange={() => togglePermission(item.id)} className="size-4 accent-emerald-600 disabled:opacity-80" /></label>; })}</div></section>)}</div>
        </article>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[minmax(110px,0.8fr)_minmax(0,1.2fr)] gap-3"><dt className="text-slate-500">{label}</dt><dd className="break-words font-medium text-slate-900">{value}</dd></div>;
}
