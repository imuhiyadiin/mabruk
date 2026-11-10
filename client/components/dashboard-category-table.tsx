"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Boxes,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  ArrowDownUp,
  CircleAlert,
  Ellipsis,
  Filter,
  FolderOpen,
  Grid2X2,
  Image as ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Category = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  Product?: { id: string }[];
  user?: { fullname: string; email: string; role: string } | null;
};

type CategoryResponse = {
  message?: string;
  result?: Category[] | Category;
};

const categoryFilters = ["All Categories", "With Products", "Empty Categories"] as const;
type CategoryFilter = (typeof categoryFilters)[number];

function getApiBase() {
  return "/api";
}

function CategoryStat({
  title,
  value,
  caption,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: typeof Tags;
  color: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", color)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-0.5 text-xl font-semibold text-slate-900">{value}</p>
          <p className="mt-1 text-[10px] text-slate-400">{caption}</p>
        </div>
      </div>
    </article>
  );
}

export default function CategoryTable() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>("All Categories");
  const [search, setSearch] = useState("");
  const [sortAscending, setSortAscending] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "products" | "created">("name");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showStatistics, setShowStatistics] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${getApiBase()}/category`, { cache: "no-store" });
      const payload = (await response.json()) as CategoryResponse;
      if (!response.ok || !Array.isArray(payload.result)) {
        throw new Error(payload.message ?? "Categories lama soo shubi karin.");
      }
      setCategories(payload.result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Server-ka lama heli karo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) => {
      const productCount = category.Product?.length ?? 0;
      const matchesFilter = filter === "All Categories"
        || (filter === "With Products" && productCount > 0)
        || (filter === "Empty Categories" && productCount === 0);
      const matchesSearch = !query
        || category.name.toLowerCase().includes(query)
        || (category.description ?? "").toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    }).sort((a, b) => {
      const order = sortBy === "name"
        ? a.name.localeCompare(b.name)
        : sortBy === "products"
          ? (a.Product?.length ?? 0) - (b.Product?.length ?? 0)
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return order * (sortAscending ? 1 : -1);
    });
  }, [categories, filter, search, sortAscending, sortBy]);

  const totalProducts = categories.reduce((total, category) => total + (category.Product?.length ?? 0), 0);
  const usedCategories = categories.filter((category) => (category.Product?.length ?? 0) > 0).length;
  const emptyCategories = categories.length - usedCategories;

  function toggleCategory(id: string) {
    setSelectedCategories((selected) => selected.includes(id)
      ? selected.filter((categoryId) => categoryId !== id)
      : [...selected, id],
    );
  }

  function toggleAllCategories() {
    const visibleIds = filteredCategories.map((category) => category.id);
    const allSelected = visibleIds.every((id) => selectedCategories.includes(id));
    setSelectedCategories((selected) => allSelected
      ? selected.filter((id) => !visibleIds.includes(id))
      : Array.from(new Set([...selected, ...visibleIds])),
    );
  }

  function getAccessToken() {
    const storedUser = window.localStorage.getItem("user-data");
    try {
      return storedUser ? (JSON.parse(storedUser) as { access_token?: string }).access_token ?? "" : "";
    } catch {
      return "";
    }
  }

  function openCreateDialog() {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setError("");
    setIsDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setImageUrl(category.imageUrl ?? "");
    setError("");
    setIsDialogOpen(true);
  }

  async function handleSaveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const accessToken = getAccessToken();

    if (!accessToken) {
      setError("Fadlan marka hore ku gal akoon admin ah.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(editingCategory
        ? `${getApiBase()}/category/${encodeURIComponent(editingCategory.name)}`
        : `${getApiBase()}/category`, {
        method: editingCategory ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          image: imageUrl.trim(),
        }),
      });
      const payload = (await response.json()) as CategoryResponse;
      if (!response.ok || !payload.result || Array.isArray(payload.result)) {
        throw new Error(payload.message ?? (editingCategory ? "Category-ga lama cusboonaysiin karin." : "Category-ga lama abuuri karin."));
      }

      if (editingCategory) {
        const updated = payload.result as Category;
        setCategories((current) => current.map((category) => category.id === updated.id ? updated : category));
      } else {
        setCategories((current) => [payload.result as Category, ...current]);
      }
      setName("");
      setDescription("");
      setImageUrl("");
      setIsDialogOpen(false);
      setEditingCategory(null);
      setSuccess(editingCategory ? "Category-ga waa la cusboonaysiiyay." : "Category-ga waa la sameeyay.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Category-ga lama abuuri karin.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    if (!window.confirm(`Ma hubtaa inaad tirtirayso category-ga "${category.name}"?`)) return;
    setError("");
    setSuccess("");
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Fadlan marka hore ku gal akoon admin ah.");
      return;
    }
    try {
      const response = await fetch(`${getApiBase()}/category/${encodeURIComponent(category.name)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = (await response.json()) as CategoryResponse;
      if (!response.ok) throw new Error(payload.message ?? "Category-ga lama tirtiri karin.");
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setSelectedCategories((current) => current.filter((id) => id !== category.id));
      setSuccess("Category-ga waa la tirtiray.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Category-ga lama tirtiri karin.");
    }
  }

  return (
    <div className="min-w-0 space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Category</h2>
          <p className="mt-1 text-sm text-slate-500">Organize your products into clear, easy-to-manage categories</p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-orange-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700"
        >
          <Plus className="size-4" /> Add New Category
        </button>
      </div>

      {showStatistics && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CategoryStat title="Total Categories" value={categories.length} caption="Categories in your store" icon={Tags} color="bg-orange-50 text-orange-600" />
        <CategoryStat title="Products Categorized" value={totalProducts} caption="Products assigned to categories" icon={Boxes} color="bg-blue-50 text-blue-600" />
        <CategoryStat title="Categories With Products" value={usedCategories} caption="Currently used by products" icon={FolderOpen} color="bg-violet-50 text-violet-600" />
        <CategoryStat title="Empty Categories" value={emptyCategories} caption="Ready for products" icon={CircleAlert} color="bg-amber-50 text-amber-600" />
      </div>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <label className="flex h-10 min-w-[190px] flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-400 focus-within:border-orange-300 sm:max-w-xs">
            <Search className="size-4 shrink-0" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50"><Grid2X2 className="size-4" /> {viewMode === "table" ? "Table View" : "Grid View"} <ChevronDown className="size-4" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewMode("table")}>Table View{viewMode === "table" ? " ✓" : ""}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("grid")}>Grid View{viewMode === "grid" ? " ✓" : ""}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50"><Filter className="size-4" /> Filter</DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {categoryFilters.map((item) => <DropdownMenuItem key={item} onClick={() => setFilter(item)}>{item}{filter === item ? " ✓" : ""}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50"><ArrowDownUp className="size-4" /> Sort</DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setSortBy("name"); setSortAscending(true); }}>Name A–Z{sortBy === "name" && sortAscending ? " ✓" : ""}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("name"); setSortAscending(false); }}>Name Z–A{sortBy === "name" && !sortAscending ? " ✓" : ""}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortBy("products"); setSortAscending(false); }}>Most products first{sortBy === "products" && !sortAscending ? " ✓" : ""}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("products"); setSortAscending(true); }}>Fewest products first{sortBy === "products" && sortAscending ? " ✓" : ""}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortBy("created"); setSortAscending(false); }}>Newest first{sortBy === "created" && !sortAscending ? " ✓" : ""}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("created"); setSortAscending(true); }}>Oldest first{sortBy === "created" && sortAscending ? " ✓" : ""}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button type="button" role="switch" aria-checked={showStatistics} onClick={() => setShowStatistics((value) => !value)} className="ml-auto inline-flex h-10 items-center gap-3 whitespace-nowrap px-1 text-sm text-slate-700">Show Statistics <span className={cn("relative h-6 w-11 rounded-full transition-colors", showStatistics ? "bg-orange-600" : "bg-slate-300")}><span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", showStatistics ? "translate-x-[22px]" : "translate-x-0.5")} /></span></button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
          {categoryFilters.map((item) => {
            const count = item === "All Categories" ? categories.length : item === "With Products" ? usedCategories : emptyCategories;
            const active = filter === item;
            return <button key={item} type="button" onClick={() => setFilter(item)} className={cn("h-8 rounded-full border px-3 text-xs font-medium transition-colors", active ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100")}>{item} ({count})</button>;
          })}
        </div>

        {error && !isDialogOpen && (
          <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => void loadCategories()} className="font-semibold underline">Retry</button>
          </div>
        )}
        {success && <p role="status" className="px-4 pt-3 text-sm text-emerald-700">{success}</p>}

        {viewMode === "table" ? <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="h-10 border-b border-slate-200">
                <th className="w-10 px-4">
                  <input
                    type="checkbox"
                    aria-label="Select all categories"
                    checked={filteredCategories.length > 0 && filteredCategories.every((category) => selectedCategories.includes(category.id))}
                    onChange={toggleAllCategories}
                    className="size-3.5 rounded border-slate-300 accent-orange-600"
                  />
                </th>
                {["Category", "Description", "Products", "Created By", "Created At"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap border-l border-slate-200 px-3 font-medium">
                    <span className="inline-flex items-center gap-1">{heading}<ChevronsUpDown className="size-3 text-slate-400" /></span>
                  </th>
                ))}
                <th className="border-l border-slate-200 px-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="h-36 text-center text-slate-500"><LoaderCircle className="mr-2 inline size-4 animate-spin" />Loading categories...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-48 px-6 text-center">
                    <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"><FolderOpen className="size-5" /></span>
                    <p className="mt-3 font-medium text-slate-800">{categories.length ? "No matching categories" : "No categories yet"}</p>
                    <p className="mt-1 text-slate-500">{categories.length ? "Try another search or filter." : "Create your first category to organize products."}</p>
                  </td>
                </tr>
              ) : filteredCategories.map((category) => {
                const productCount = category.Product?.length ?? 0;
                return (
                  <tr key={category.id} className="h-[58px] border-b border-slate-200 text-slate-700 last:border-b-0 hover:bg-slate-50">
                    <td className="px-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${category.name}`}
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="size-3.5 rounded border-slate-300 accent-orange-600"
                      />
                    </td>
                    <td className="border-l border-slate-100 px-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-orange-50 text-orange-600">
                          {category.imageUrl ? <img src={category.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon className="size-4" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-800">{category.name}</span>
                          <span className="block truncate text-[10px] text-slate-400">{category.id}</span>
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[260px] border-l border-slate-100 px-3 text-slate-500"><span className="block truncate">{category.description || "—"}</span></td>
                    <td className="border-l border-slate-100 px-3"><span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">{productCount}</span></td>
                    <td className="border-l border-slate-100 px-3">{category.user?.fullname ?? "—"}</td>
                    <td className="whitespace-nowrap border-l border-slate-100 px-3 text-slate-500"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{new Date(category.createdAt).toLocaleDateString()}</span></td>
                    <td className="border-l border-slate-100 px-3 text-center"><DropdownMenu><DropdownMenuTrigger aria-label={`Actions for ${category.name}`} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Ellipsis className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-40"><DropdownMenuItem onClick={() => openEditDialog(category)}><Pencil className="mr-2 size-4" />Update</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => void handleDeleteCategory(category)} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 size-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div> : <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? <div className="col-span-full py-12 text-center text-sm text-slate-500"><LoaderCircle className="mr-2 inline size-4 animate-spin" />Loading categories...</div>
            : filteredCategories.length === 0 ? <div className="col-span-full py-12 text-center text-sm text-slate-500">{categories.length ? "No matching categories" : "No categories yet"}</div>
              : filteredCategories.map((category) => <article key={category.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-orange-50 text-orange-600">{category.imageUrl ? <img src={category.imageUrl} alt={category.name} className="size-full object-cover" /> : <ImageIcon className="size-5" />}</span>
                  <div className="min-w-0 flex-1"><h3 className="truncate font-medium text-slate-900">{category.name}</h3><p className="mt-1 line-clamp-2 text-xs text-slate-500">{category.description || "No description"}</p></div>
                  <DropdownMenu><DropdownMenuTrigger aria-label={`Actions for ${category.name}`} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Ellipsis className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-40"><DropdownMenuItem onClick={() => openEditDialog(category)}><Pencil className="mr-2 size-4" />Update</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => void handleDeleteCategory(category)} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 size-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span>{category.Product?.length ?? 0} products</span><span>{category.user?.fullname ?? "—"}</span></div>
              </article>)}
        </div>}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>Showing {filteredCategories.length ? 1 : 0}-{filteredCategories.length} of {categories.length} categories{selectedCategories.length > 0 ? ` · ${selectedCategories.length} selected` : ""}</span>
          <nav aria-label="Category table pagination" className="flex items-center gap-1">
            <button type="button" aria-label="Previous page" disabled className="flex size-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-50"><ChevronLeft className="size-4" /></button>
            <button type="button" aria-current="page" className="size-8 rounded-lg bg-orange-600 text-xs font-semibold text-white">1</button>
            <button type="button" aria-label="Next page" disabled className="flex size-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-50"><ChevronRight className="size-4" /></button>
          </nav>
        </footer>
      </section>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) setIsDialogOpen(false); }}>
          <form onSubmit={handleSaveCategory} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{editingCategory ? "Update Category" : "Add New Category"}</h3>
                <p className="mt-1 text-sm text-slate-500">Only the category name is required. Description and image are optional.</p>
              </div>
              <button type="button" aria-label="Close dialog" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button>
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Category name</span>
                <input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Clothing" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></span>
                <textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe this category" rows={3} className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Image URL <span className="font-normal text-slate-400">(optional)</span></span>
                <input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/category.jpg" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isSaving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
                {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                {isSaving ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
