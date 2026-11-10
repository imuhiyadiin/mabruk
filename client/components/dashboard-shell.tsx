"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Globe,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Bell,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Settings,
  ShoppingCart,
  TableProperties,
  Tags,
  Search,
  Sun,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { translateDashboard, type DashboardLanguage } from "@/lib/dashboard-language";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserData = {
  email?: string;
  fullName?: string;
  fullname?: string;
};

const itemGroups = [
  {
    label: "Platform",
    items: [
      { label: "Home", href: "/", icon: Home },
      { label: "Dashboard", href: "/dashbordmain/dashbord", icon: LayoutDashboard },
      { label: "Analytics", href: "/dashbordmain/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Store",
    items: [
      { label: "Products", href: "/dashbordmain/product", icon: Package },
      { label: "Category", href: "/dashbordmain/category", icon: Tags },
      { label: "Tables", href: "/dashbordmain/cart", icon: TableProperties },
      { label: "Orders", href: "/dashbordmain/order", icon: ShoppingCart },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Customers", href: "/dashbordmain/customers", icon: Users },
      { label: "User & Roles", href: "/dashbordmain/users-roles", icon: UserCog },
      { label: "Settings", href: "/dashbordmain/settings", icon: Settings },
    ],
  },
];

export default function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState("2026 / 2027");
  const [language, setLanguage] = useState<DashboardLanguage>("EN");
  const [darkMode, setDarkMode] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function syncUser() {
      const storedUser = window.localStorage.getItem("user-data");
      if (!storedUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(storedUser) as UserData);
      } catch {
        window.localStorage.removeItem("user-data");
        setUser(null);
      }
    }

    syncUser();
    window.addEventListener("auth-change", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("auth-change", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  useEffect(() => {
    const applySavedTheme = () => {
      const savedTheme = window.localStorage.getItem("theme");
      const useDarkTheme = savedTheme === "dark";
      document.documentElement.classList.toggle("dark", useDarkTheme);
      document.documentElement.style.colorScheme = useDarkTheme ? "dark" : "light";
      setDarkMode(useDarkTheme);
    };
    applySavedTheme();
    const savedLanguage = window.localStorage.getItem("dashboard-language");
    if (savedLanguage === "SO" || savedLanguage === "EN") setLanguage(savedLanguage);
    const savedAcademicYear = window.localStorage.getItem("academic-year");
    if (savedAcademicYear && ["2026 / 2027", "2025 / 2026", "2024 / 2025"].includes(savedAcademicYear)) setAcademicYear(savedAcademicYear);
    window.addEventListener("storage", applySavedTheme);
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("storage", applySavedTheme);
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  useEffect(() => {
    const root = document.body;
    root.dataset.language = language;
    translateDashboard(root, language);
    const observer = new MutationObserver(() => translateDashboard(root, language));
    observer.observe(root, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [language, pathname]);

  function handleLogout() {
    window.localStorage.removeItem("user-data");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/auth/singin");
  }

  const displayName = user?.fullName ?? user?.fullname ?? user?.email?.split("@")[0] ?? "Admin";
  const userInitial = displayName.trim().charAt(0).toLocaleUpperCase() || "A";
  const currentItem = itemGroups.flatMap((group) => group.items).find((item) => item.href === pathname || pathname.startsWith(`${item.href}/`));
  const currentPageLabel = currentItem?.label ?? activeItem;
  const currentGroup = itemGroups.find((group) => group.items.some((item) => item.href === pathname || pathname.startsWith(`${item.href}/`)))?.label ?? "Platform";
  const filteredLinks = itemGroups.flatMap((group) => group.items).filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase()));

  function toggleTheme() {
    const nextTheme = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextTheme);
    document.documentElement.style.colorScheme = nextTheme ? "dark" : "light";
    window.localStorage.setItem("theme", nextTheme ? "dark" : "light");
    setDarkMode(nextTheme);
  }

  return (
    <main className="dashboard-theme h-screen min-h-screen w-full bg-background p-0">
      <div className="flex h-full min-h-screen w-full overflow-hidden bg-background">
        {mobileOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={cn(
            "dashboard-sidebar z-40 flex shrink-0 flex-col border-r border-white/15 bg-[linear-gradient(160deg,#254FC9_0%,#304BCB_48%,#4245C4_100%)] text-white transition-all duration-200",
            collapsed ? "w-[4.25rem]" : "w-60",
            "fixed inset-y-0 left-0 md:static",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-white/15 px-4">
            <div className={cn("flex min-w-0 items-center gap-3", collapsed && "md:hidden")}>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                <Package className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">IFAAYE Mart</p>
                <p className="truncate text-xs text-white/70">Admin panel</p>
              </div>
            </div>
            <button
              type="button"
              aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
              className="rounded-md p-2 text-white/70 hover:bg-white/15 hover:text-white md:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden rounded-md p-2 text-white/70 hover:bg-white/15 hover:text-white md:inline-flex"
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          </div>

          <nav aria-label="Dashboard navigation" className="flex-1 space-y-6 overflow-y-auto p-3">
            {itemGroups.map((group) => (
              <section key={group.label}>
                <p className={cn("mb-2 px-2 text-xs font-medium text-white/70", collapsed && "md:sr-only")}>
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.items.map(({ label, href, icon: Icon }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        title={collapsed ? label : undefined}
                        aria-current={pathname === href ? "page" : undefined}
                        onClick={() => {
                          setMobileOpen(false);
                        }}
                        className={cn(
                          "flex h-9 w-full items-center gap-3 rounded-md px-2 text-left text-sm transition-colors hover:bg-white/15 hover:text-white",
                          pathname === href && "bg-white/20 font-medium text-white",
                          collapsed && "md:justify-center md:px-0",
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className={cn(collapsed && "md:hidden")}>{label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>

          <div className="border-t p-3">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Open account menu for ${displayName}`}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md p-2 text-left outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70",
                  collapsed && "md:justify-center",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">{userInitial}</span>
                <span className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
                  <span className="block truncate text-sm font-medium">{displayName}</span>
                  <span className="block truncate text-xs text-white/70">{user?.email ?? "Admin account"}</span>
                </span>
                <ChevronDown className={cn("size-4 shrink-0 text-white/70", collapsed && "md:hidden")} />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="end"
                className="w-[260px] rounded-xl border-white/10 bg-[#171717] p-1 text-white shadow-xl"
              >
                <div className="flex items-center gap-3 px-2 py-1.5">
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#A1B5D8] text-sm font-semibold text-[#172033]">{userInitial}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{displayName}</span>
                    <span className="block truncate text-xs text-white/60">{user?.email ?? "Admin account"}</span>
                  </span>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => setActiveItem("Upgrade to Pro")} className="gap-2 text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white">
                  <Sparkles className="size-4" /> Upgrade to Pro
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => setActiveItem("Account")} className="gap-2 text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white">
                  <BadgeCheck className="size-4" /> Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveItem("Billing")} className="gap-2 text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white">
                  <CreditCard className="size-4" /> Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveItem("Notifications")} className="gap-2 text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white">
                  <Bell className="size-4" /> Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white">
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-20 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 sm:px-6">
            <button
              type="button"
              aria-label="Open navigation menu"
              className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
              <Link href="/dashbordmain/dashbord" aria-label="Dashboard home" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"><Home className="size-4" /></Link>
              <ChevronRight className="size-3.5 shrink-0 text-slate-400" />
              <span className="hidden text-slate-500 sm:inline">{currentGroup}</span>
              <ChevronRight className="hidden size-3.5 shrink-0 text-slate-400 sm:inline" />
              <span className="truncate font-medium text-slate-900 dark:text-white">{currentPageLabel}</span>
            </nav>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input ref={searchRef} value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); if (event.key === "Enter" && filteredLinks[0]) { router.push(filteredLinks[0].href); setSearchOpen(false); setSearch(""); } }} placeholder="Search..." aria-label="Search dashboard pages" className="h-9 w-44 rounded-lg border border-slate-200 bg-white pl-9 pr-16 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white lg:w-56" />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700">Ctrl K</kbd>
                {searchOpen && search.trim() && <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">{filteredLinks.length ? filteredLinks.map((item) => <button key={item.href} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { router.push(item.href); setSearchOpen(false); setSearch(""); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><item.icon className="size-4 text-slate-500" />{item.label}</button>) : <p className="px-3 py-2 text-xs text-slate-500">No dashboard pages found</p>}</div>}
              </div>
              <select aria-label="Academic year" value={academicYear} onChange={(event) => { const year = event.target.value; setAcademicYear(year); window.localStorage.setItem("academic-year", year); window.dispatchEvent(new CustomEvent("academic-year-change", { detail: year })); }} className="h-9 max-w-[125px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium outline-none dark:border-slate-700 dark:bg-slate-900 sm:px-3 sm:text-sm"><option>2026 / 2027</option><option>2025 / 2026</option><option>2024 / 2025</option></select>
              <label className="flex h-9 items-center gap-1 rounded-lg px-1.5 text-xs font-medium"><Globe className="size-4" /><select aria-label="Language" value={language} onChange={(event) => { const nextLanguage = event.target.value as DashboardLanguage; setLanguage(nextLanguage); window.localStorage.setItem("dashboard-language", nextLanguage); }} className="max-w-12 bg-transparent outline-none dark:bg-slate-950"><option value="EN">EN</option><option value="SO">SO</option></select></label>
              <button type="button" onClick={toggleTheme} aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"} className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
              <DropdownMenu><DropdownMenuTrigger aria-label="Notifications" className="relative flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-orange-500" /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64 rounded-xl p-3 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><p className="text-sm font-semibold">Notifications</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">You’re all caught up.</p></DropdownMenuContent></DropdownMenu>
              <DropdownMenu><DropdownMenuTrigger aria-label={`Open account menu for ${displayName}`} className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{userInitial}</DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56 rounded-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white"><div className="px-3 py-2"><p className="truncate text-sm font-medium">{displayName}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email ?? "Admin account"}</p></div><DropdownMenuSeparator /><DropdownMenuItem onClick={handleLogout} className="gap-2 dark:text-white dark:data-[highlighted]:bg-slate-800"><LogOut className="size-4" />Log out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </section>
      </div>
    </main>
  );
}
