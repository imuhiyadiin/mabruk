"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownUp,
  BarChart3,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  Ellipsis,
  Filter,
  Grid2X2,
  HandCoins,
  Image as ImageIcon,
  Info,
  LoaderCircle,
  Package,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Product = {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  quantity: number;
  imageUrl: string;
  description: string | null;
  categoryId: string;
  color: string | null;
  size: string | null;
  createdAt: string;
  category?: { id: string; name: string };
};

type CategoryOption = { id: string; name: string };
type ApiResponse<T> = { message?: string; result?: T };
type ProductFilter = "All Products" | "In Stock" | "Out of Stock" | "Low Stock";

const filters: ProductFilter[] = ["All Products", "In Stock", "Out of Stock", "Low Stock"];

function getApiBase() {
  return "/api";
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof Package;
  iconClass: string;
}) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-4">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", iconClass)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-0.5 text-xl font-semibold leading-6 text-slate-900">{value}</p>
          <p className="mt-1.5 truncate text-[10px] text-slate-400">{note}</p>
        </div>
      </div>
    </article>
  );
}

export default function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [filter, setFilter] = useState<ProductFilter>("All Products");
  const [search, setSearch] = useState("");
  const [showStatistics, setShowStatistics] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortAscending, setSortAscending] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "price" | "quantity">("name");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${getApiBase()}/product`, { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse<Product[]>;
      if (!response.ok || !Array.isArray(payload.result)) {
        throw new Error(payload.message ?? "Products lama soo shubi karin.");
      }
      setProducts(payload.result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Server-ka lama heli karo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBase()}/category`, { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse<{ id: string; name: string }[]>;
      if (response.ok && Array.isArray(payload.result)) setCategories(payload.result);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
    void loadCategories();
  }, [loadProducts, loadCategories]);

  const lowStockCount = products.filter((product) => product.quantity > 0 && product.quantity <= 10).length;
  const inStockCount = products.filter((product) => product.quantity > 0).length;
  const outOfStockCount = products.filter((product) => product.quantity === 0).length;
  const inventoryUnits = products.reduce((total, product) => total + product.quantity, 0);
  const inventoryValue = products.reduce((total, product) => total + product.price * product.quantity, 0);
  const averagePrice = products.length ? products.reduce((total, product) => total + product.price, 0) / products.length : 0;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesFilter = filter === "All Products"
        || (filter === "In Stock" && product.quantity > 0)
        || (filter === "Out of Stock" && product.quantity === 0)
        || (filter === "Low Stock" && product.quantity > 0 && product.quantity <= 10);
      const matchesSearch = !query
        || product.name.toLowerCase().includes(query)
        || (product.category?.name ?? "").toLowerCase().includes(query)
        || (product.slug ?? "").toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const order = sortBy === "name" ? a.name.localeCompare(b.name) : sortBy === "price" ? a.price - b.price : a.quantity - b.quantity;
      return sortAscending ? order : -order;
    });
  }, [filter, products, search, sortAscending, sortBy]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pageProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  function setProductFilter(nextFilter: ProductFilter) {
    setFilter(nextFilter);
    setPage(1);
  }

  function toggleProduct(id: string) {
    setSelectedProducts((selected) => selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id],
    );
  }

  function toggleAll() {
    const visibleIds = pageProducts.map((product) => product.id);
    const areAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProducts.includes(id));
    setSelectedProducts((selected) => areAllSelected
      ? selected.filter((id) => !visibleIds.includes(id))
      : Array.from(new Set([...selected, ...visibleIds])),
    );
  }

  function exportProducts() {
    const rows = [
      ["Name", "Slug", "Price", "Quantity", "Category", "Color", "Size"],
      ...filteredProducts.map((product) => [product.name, product.slug ?? "", product.price, product.quantity, product.category?.name ?? "", product.color ?? "", product.size ?? ""]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "products.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function getAccessToken() {
    const storedUser = window.localStorage.getItem("user-data");
    try {
      return storedUser ? (JSON.parse(storedUser) as { access_token?: string }).access_token ?? "" : "";
    } catch {
      return "";
    }
  }

  function openCreateProduct() {
    setEditingProduct(null);
    setName(""); setPrice(""); setQuantity(""); setCategoryId("");
    setImageUrl(""); setDescription(""); setColor(""); setSize("");
    setFormError("");
    setIsDialogOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setPrice(String(product.price));
    setQuantity(String(product.quantity));
    setCategoryId(product.categoryId);
    setImageUrl(product.imageUrl);
    setDescription(product.description ?? "");
    setColor(product.color ?? "");
    setSize(product.size ?? "");
    setFormError("");
    setIsDialogOpen(true);
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    const accessToken = getAccessToken();
    if (!accessToken) {
      setFormError("Fadlan marka hore ku gal akoon admin ah.");
      return;
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setIsSaving(true);
    try {
      const response = await fetch(editingProduct
        ? `${getApiBase()}/product/${encodeURIComponent(editingProduct.slug ?? editingProduct.id)}`
        : `${getApiBase()}/product`, {
        method: editingProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          price: Number(price),
          quantity: Number(quantity),
          categoryId,
          image: imageUrl.trim(),
          description: description.trim(),
          color: color.trim(),
          size: size.trim(),
        }),
      });
      const payload = (await response.json()) as ApiResponse<{ newProduct?: Product }>;
      if (!response.ok) throw new Error(payload.message ?? (editingProduct ? "Product lama cusboonaysiin karin." : "Product lama abuuri karin."));

      await loadProducts();
      setName("");
      setPrice("");
      setQuantity("");
      setCategoryId("");
      setImageUrl("");
      setDescription("");
      setColor("");
      setSize("");
      setPage(1);
      setIsDialogOpen(false);
      setEditingProduct(null);
      setSuccess(editingProduct ? "Product-ka waa la cusboonaysiiyay." : "Product-ka waa la sameeyay.");
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Product lama abuuri karin.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    if (!window.confirm(`Ma hubtaa inaad tirtirayso product-ka "${product.name}"?`)) return;
    setError("");
    setSuccess("");
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Fadlan marka hore ku gal akoon admin ah.");
      return;
    }
    try {
      const response = await fetch(`${getApiBase()}/product/${encodeURIComponent(product.slug ?? product.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = (await response.json()) as ApiResponse<unknown>;
      if (!response.ok) throw new Error(payload.message ?? "Product lama tirtiri karin.");
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setSelectedProducts((current) => current.filter((id) => id !== product.id));
      setSuccess("Product-ka waa la tirtiray.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Product lama tirtiri karin.");
    }
  }

  async function loadProductDetails(product: Product) {
    setDetailsProduct(product);
    setDetailsLoading(true);
    setDetailsError("");
    try {
      const identifier = product.slug ?? product.id;
      const response = await fetch(`${getApiBase()}/product/${encodeURIComponent(identifier)}`, { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse<Product>;
      if (!response.ok || !payload.result || Array.isArray(payload.result)) {
        throw new Error(payload.message ?? "Faahfaahinta product-ka lama heli karin.");
      }
      setDetailsProduct(payload.result as Product);
    } catch (detailsLoadError) {
      setDetailsError(detailsLoadError instanceof Error ? detailsLoadError.message : "Faahfaahinta product-ka lama heli karin.");
    } finally {
      setDetailsLoading(false);
    }
  }

  const filterCounts: Record<ProductFilter, number> = {
    "All Products": products.length,
    "In Stock": inStockCount,
    "Out of Stock": outOfStockCount,
    "Low Stock": lowStockCount,
  };

  return (
    <div className="min-w-0 space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Product</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your products, track inventory, and grow your store</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Settings2 className="size-3.5" /> Customize View
          </button>
          <button type="button" onClick={exportProducts} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Download className="size-3.5" /> Export
          </button>
          <button type="button" onClick={openCreateProduct} className="inline-flex h-9 items-center gap-2 rounded-lg bg-orange-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700">
            <Plus className="size-4" /> Add New Product
          </button>
        </div>
      </div>

      {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      {showStatistics && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Products" value={String(products.length)} note="Products in your catalog" icon={Package} iconClass="bg-orange-50 text-orange-600" />
          <MetricCard title="Inventory Value" value={`$${inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} note="Price Ã— available quantity" icon={BarChart3} iconClass="bg-blue-50 text-blue-600" />
          <MetricCard title="Units in Stock" value={inventoryUnits.toLocaleString()} note={`${inStockCount} products currently available`} icon={Boxes} iconClass="bg-violet-50 text-violet-600" />
          <MetricCard title="Average Price" value={`$${averagePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} note="Average catalog price" icon={HandCoins} iconClass="bg-amber-50 text-amber-600" />
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((item) => (
              <button key={item} type="button" onClick={() => setProductFilter(item)} className={cn(
                "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
                filter === item ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100",
              )}>
                {item} ({filterCounts[item]})
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-8 w-44 items-center gap-2 rounded-lg border border-slate-200 px-2.5 text-slate-400 focus-within:border-orange-300">
              <Search className="size-3.5 shrink-0" />
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search products" className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" />
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
                {filters.map((item) => <DropdownMenuItem key={item} onClick={() => setProductFilter(item)}>{item}{filter === item ? " ✓" : ""}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50"><ArrowDownUp className="size-4" /> Sort</DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSortBy("name"); setSortAscending(true); }}>Name A–Z{sortBy === "name" && sortAscending ? " ✓" : ""}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("name"); setSortAscending(false); }}>Name Z–A{sortBy === "name" && !sortAscending ? " ✓" : ""}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setSortBy("price"); setSortAscending(true); }}>Price: Low to High{sortBy === "price" && sortAscending ? " ✓" : ""}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("price"); setSortAscending(false); }}>Price: High to Low{sortBy === "price" && !sortAscending ? " ✓" : ""}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setSortBy("quantity"); setSortAscending(true); }}>Quantity: Low to High{sortBy === "quantity" && sortAscending ? " ✓" : ""}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("quantity"); setSortAscending(false); }}>Quantity: High to Low{sortBy === "quantity" && !sortAscending ? " ✓" : ""}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button type="button" aria-pressed={showStatistics} onClick={() => setShowStatistics((value) => !value)} className="inline-flex h-8 items-center gap-2 px-1 text-xs font-medium text-slate-600">
              Show Statistics
              <span className={cn("relative h-5 w-9 rounded-full transition-colors", showStatistics ? "bg-orange-600" : "bg-slate-300")}>
                <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform", showStatistics ? "translate-x-4" : "translate-x-0.5")} />
              </span>
            </button>
          </div>
        </div>

        {error && <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void loadProducts()} className="font-semibold underline">Retry</button></div>}

        {viewMode === "table" ? <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="h-9 border-b border-slate-200">
                <th className="w-10 px-4"><input type="checkbox" aria-label="Select all products on this page" checked={pageProducts.length > 0 && pageProducts.every((product) => selectedProducts.includes(product.id))} onChange={toggleAll} className="size-3.5 rounded border-slate-300 accent-orange-600" /></th>
                {["Product", "Price", "Category", "Quantity", "Size / Color", "Status", "Added", "Action"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap border-l border-slate-200 px-3 font-medium"><span className="inline-flex items-center gap-1">{heading}{heading !== "Action" && <ChevronsUpDown className="size-3 text-slate-400" />}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="h-36 text-center text-slate-500"><LoaderCircle className="mr-2 inline size-4 animate-spin" />Loading products...</td></tr>
              ) : pageProducts.length === 0 ? (
                <tr><td colSpan={9} className="h-48 px-6 text-center">
                  <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Package className="size-5" /></span>
                  <p className="mt-3 font-medium text-slate-800">{products.length ? "No matching products" : "No products yet"}</p>
                  <p className="mt-1 text-slate-500">{products.length ? "Try another search or filter." : "Add your first product to see it here."}</p>
                </td></tr>
              ) : pageProducts.map((product, index) => {
                const inStock = product.quantity > 0;
                return (
                  <tr key={product.id} className={cn("h-[48px] border-b border-slate-200 text-slate-700 last:border-b-0", index === 1 ? "bg-orange-50" : "hover:bg-slate-50")}>
                    <td className="px-4"><input type="checkbox" aria-label={`Select ${product.name}`} checked={selectedProducts.includes(product.id)} onChange={() => toggleProduct(product.id)} className="size-3.5 rounded border-slate-300 accent-orange-600" /></td>
                    <td className="whitespace-nowrap border-l border-slate-100 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-slate-400">
                          {product.imageUrl ? <img src={product.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon className="size-4" />}
                        </span>
                        <span><span className="block font-medium text-slate-800">{product.name}</span><span className="block text-[10px] text-slate-400">{product.slug ?? product.id}</span></span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap border-l border-slate-100 px-3">${product.price.toFixed(2)}</td>
                    <td className="whitespace-nowrap border-l border-slate-100 px-3">{product.category?.name ?? "â€”"}</td>
                    <td className="whitespace-nowrap border-l border-slate-100 px-3">{product.quantity} pcs</td>
                    <td className="whitespace-nowrap border-l border-slate-100 px-3">{[product.size, product.color].filter(Boolean).join(" Â· ") || "â€”"}</td>
                    <td className="border-l border-slate-100 px-3"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium", inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>{inStock ? "In Stock" : "Out of Stock"}</span></td>
                    <td className="whitespace-nowrap border-l border-slate-100 px-3 text-slate-500"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{new Date(product.createdAt).toLocaleDateString()}</span></td>
                    <td className="border-l border-slate-100 px-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger aria-label={`Actions for ${product.name}`} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Ellipsis className="size-4" /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openEditProduct(product)}>Update</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void loadProductDetails(product)}>View details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => void handleDeleteProduct(product)} className="text-red-600 focus:text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div> : <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? <div className="col-span-full py-12 text-center text-sm text-slate-500"><LoaderCircle className="mr-2 inline size-4 animate-spin" />Loading products...</div>
            : pageProducts.length === 0 ? <div className="col-span-full py-12 text-center text-sm text-slate-500">{products.length ? "No matching products" : "No products yet"}</div>
              : pageProducts.map((product) => <article key={product.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-400">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="size-full object-cover" /> : <ImageIcon className="size-5" />}</span>
                  <div className="min-w-0 flex-1"><h3 className="truncate font-medium text-slate-900">{product.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{product.category?.name ?? "No category"}</p><p className="mt-2 font-semibold text-slate-900">${product.price.toFixed(2)}</p></div>
                  <DropdownMenu><DropdownMenuTrigger aria-label={`Actions for ${product.name}`} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Ellipsis className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-40"><DropdownMenuItem onClick={() => openEditProduct(product)}>Update</DropdownMenuItem><DropdownMenuItem onClick={() => void loadProductDetails(product)}>View details</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => void handleDeleteProduct(product)} className="text-red-600 focus:text-red-600">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span>{product.quantity} pcs</span><span className={cn("rounded-full px-2.5 py-1 font-medium", product.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>{product.quantity > 0 ? "In Stock" : "Out of Stock"}</span></div>
              </article>)}
        </div>}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>Showing {filteredProducts.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filteredProducts.length)} of {filteredProducts.length}{selectedProducts.length > 0 ? ` Â· ${selectedProducts.length} selected` : ""}</span>
          <nav aria-label="Product table pagination" className="flex items-center gap-1">
            <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="size-4" /></button>
            <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-orange-600 px-2 text-xs font-semibold text-white">{page}</span>
            <span className="px-1">of {totalPages}</span>
            <button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="size-4" /></button>
          </nav>
        </footer>
      </section>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) setIsDialogOpen(false); }}>
          <form onSubmit={handleSaveProduct} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-lg font-semibold text-slate-900">{editingProduct ? "Update Product" : "Add New Product"}</h3><p className="mt-1 text-sm text-slate-500">Add product details and inventory information.</p></div>
              <button type="button" aria-label="Close dialog" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button>
            </div>
            {formError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            {categories.length === 0 && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Create a category before adding a product.</p>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Product name</span><input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Classic T-Shirt" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Price</span><input required type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Quantity</span><input required type="number" min={editingProduct ? "0" : "1"} step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Category</span><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Image URL</span><input required type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/product.jpg" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Size <span className="font-normal text-slate-400">(optional)</span></span><input value={size} onChange={(event) => setSize(event.target.value)} placeholder="e.g. M, L, XL" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium text-slate-700">Color <span className="font-normal text-slate-400">(optional)</span></span><input value={color} onChange={(event) => setColor(event.target.value)} placeholder="e.g. Black" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></span><textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the product" className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isSaving || categories.length === 0} className="inline-flex h-9 items-center gap-2 rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60">{isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}{isSaving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}</button>
            </div>
          </form>
        </div>
      )}

      {detailsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailsProduct(null); }}>
          <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-lg font-semibold text-slate-900">Product details</h3><p className="mt-1 text-sm text-slate-500">All saved information for this product</p></div>
              <button type="button" aria-label="Close details" onClick={() => setDetailsProduct(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button>
            </div>
            {detailsLoading && <p role="status" className="mt-4 text-sm text-slate-500">Loading product details...</p>}
            {detailsError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{detailsError}</p>}
            <div className="mt-5 flex items-center gap-4 rounded-xl bg-slate-50 p-3">
              <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-400">
                {detailsProduct.imageUrl ? <img src={detailsProduct.imageUrl} alt={detailsProduct.name} className="size-full object-cover" /> : <ImageIcon className="size-6" />}
              </span>
              <div className="min-w-0"><h4 className="truncate font-semibold text-slate-900">{detailsProduct.name}</h4><p className="mt-1 break-all text-xs text-slate-500">{detailsProduct.slug ?? detailsProduct.id}</p><p className="mt-2 text-sm font-semibold text-orange-700">${detailsProduct.price.toFixed(2)}</p></div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-slate-500">Category</dt><dd className="mt-1 font-medium text-slate-800">{detailsProduct.category?.name ?? "—"}</dd></div>
              <div><dt className="text-xs text-slate-500">Quantity</dt><dd className="mt-1 font-medium text-slate-800">{detailsProduct.quantity} pcs</dd></div>
              <div><dt className="text-xs text-slate-500">Stock status</dt><dd className="mt-1"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", detailsProduct.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>{detailsProduct.quantity > 0 ? "In Stock" : "Out of Stock"}</span></dd></div>
              <div><dt className="text-xs text-slate-500">Size</dt><dd className="mt-1 font-medium text-slate-800">{detailsProduct.size || "—"}</dd></div>
              <div><dt className="text-xs text-slate-500">Color</dt><dd className="mt-1 font-medium text-slate-800">{detailsProduct.color || "—"}</dd></div>
              <div><dt className="text-xs text-slate-500">Created</dt><dd className="mt-1 font-medium text-slate-800">{new Date(detailsProduct.createdAt).toLocaleString()}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-slate-500">Product ID</dt><dd className="mt-1 break-all font-medium text-slate-800">{detailsProduct.id}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-slate-500">Description</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{detailsProduct.description || "No description provided."}</dd></div>
            </dl>
            <div className="mt-5 flex justify-end"><button type="button" onClick={() => setDetailsProduct(null)} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Info className="mr-2 inline size-4" />Close</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
