"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle, Plus, RefreshCw, Search, X } from "lucide-react";

type UserRecord = { id: string; fullname: string; email: string; role: "ADMIN" | "USER"; createdAt: string };
type UsersResponse = { message?: string; result?: UserRecord[] };
type RoleFilter = "ALL" | "ADMIN" | "USER";

function getApiBase() {
  return "/api";
}

export default function DashboardUsersRolesTable() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const storedUser = window.localStorage.getItem("user-data");
      const token = storedUser ? (JSON.parse(storedUser) as { access_token?: string }).access_token : "";
      if (!token) throw new Error("Fadlan ku gal akoon admin ah si aad u aragto isticmaaleyaasha.");
      const response = await fetch(`${getApiBase()}/admin/users`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const payload = (await response.json()) as UsersResponse;
      if (!response.ok || !Array.isArray(payload.result)) throw new Error(payload.message ?? "Isticmaaleyaasha lama soo shubi karin.");
      setUsers(payload.result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Server-ka lama heli karo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesSearch = !query || user.fullname.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  async function handleAddUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    try {
      const storedUser = window.localStorage.getItem("user-data");
      const token = storedUser ? (JSON.parse(storedUser) as { access_token?: string }).access_token : "";
      const response = await fetch(`${getApiBase()}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password"), role: formData.get("role") }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Isticmaalaha lama samayn karin.");
      setIsAddOpen(false);
      await loadUsers();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Isticmaalaha lama samayn karin.");
    } finally {
      setIsSaving(false);
    }
  }

  const filters: { label: string; value: RoleFilter }[] = [
    { label: "All", value: "ALL" },
    { label: "Admin", value: "ADMIN" },
    { label: "User", value: "USER" },
  ];

  return (
    <main className="min-w-0 space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-3xl font-semibold tracking-tight text-slate-950">Users</h1><p className="mt-1 text-slate-500">People who can sign in to the store.</p></div>
        <button type="button" onClick={() => { setFormError(""); setIsAddOpen(true); }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"><Plus className="size-4" />Add user</button>
      </header>

      <nav aria-label="User role filters" className="inline-flex rounded-xl bg-slate-100 p-1">
        {filters.map((filter) => <button key={filter.value} type="button" onClick={() => setRoleFilter(filter.value)} className={`rounded-lg px-3 py-1.5 text-sm transition ${roleFilter === filter.value ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{filter.label}{filter.value === "ALL" ? ` (${users.length})` : ""}</button>)}
      </nav>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400"><Search className="size-4 shrink-0" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" /></label>
          <button type="button" aria-label="Refresh users" onClick={() => void loadUsers()} disabled={isLoading} className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} /></button>
        </div>

        {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void loadUsers()} className="font-semibold underline">Retry</button></div>}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr className="bg-slate-50 text-slate-800">{["User", "Email", "Role", "Created"].map((heading) => <th key={heading} className="px-4 py-3.5 font-medium">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? <tr><td colSpan={4} className="py-14 text-center text-sm text-slate-500"><LoaderCircle className="mr-2 inline size-4 animate-spin" />Loading users...</td></tr>
                : filteredUsers.length === 0 ? <tr><td colSpan={4} className="py-14 text-center"><p className="font-medium text-slate-700">No users found</p><p className="mt-1 text-sm text-slate-500">Try another search or filter.</p></td></tr>
                  : filteredUsers.map((user) => {
                    const initials = user.fullname.split(/\s+/).slice(0, 2).map((name) => name[0] ?? "").join("").toUpperCase();
                    return <tr key={user.id} className="text-slate-800 transition-colors hover:bg-slate-50"><td className="px-4 py-3"><Link href={`/dashbordmain/users-roles/${user.id}`} className="flex w-fit items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><span className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-100 text-xs font-medium text-slate-500">{initials}</span><span className="font-medium hover:underline">{user.fullname}</span></Link></td><td className="px-4 py-3 text-slate-700">{user.email}</td><td className="px-4 py-3"><span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{user.role === "ADMIN" ? "Admin" : "User"}</span></td><td className="px-4 py-3 text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</td></tr>;
                  })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-500">Showing {filteredUsers.length} of {users.length}</p>
      </section>

      {isAddOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsAddOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="add-user-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between"><div><h2 id="add-user-title" className="text-xl font-semibold text-slate-950">Add user</h2><p className="mt-1 text-sm text-slate-500">Create a store account and choose its role.</p></div><button type="button" aria-label="Close" onClick={() => setIsAddOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="size-4" /></button></div>
          <form onSubmit={handleAddUser} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Name<input name="name" required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-emerald-500" /></label>
            <label className="block text-sm font-medium text-slate-700">Email<input name="email" type="email" required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-emerald-500" /></label>
            <label className="block text-sm font-medium text-slate-700">Password<input name="password" type="password" minLength={6} required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-emerald-500" /></label>
            <label className="block text-sm font-medium text-slate-700">Role<select name="role" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-normal outline-none focus:border-emerald-500"><option value="USER">User</option><option value="ADMIN">Admin</option></select></label>
            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsAddOpen(false)} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{isSaving && <LoaderCircle className="size-4 animate-spin" />}Add user</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
