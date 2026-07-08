import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, LayoutDashboard, Wand2, History, Settings as SettingsIcon, LogOut, BarChart3, Building2, Shield, CalendarDays, Users, Menu, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyRoles, listBrands, getProfile } from "@/lib/generators.functions";
import { LanguageSelector } from "@/components/LanguageSelector";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const baseNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generate", label: "Generate", icon: Wand2 },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/brands", label: "Brands", icon: Building2 },
  { to: "/team", label: "Team", icon: Users },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function AuthedLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const roles = useServerFn(getMyRoles);
  const brands = useServerFn(listBrands);
  const profile = useServerFn(getProfile);
  const rolesQ = useQuery({ queryKey: ["my-roles"], queryFn: () => roles() });
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: () => brands() });
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => profile() });
  const isAdmin = rolesQ.data?.roles.includes("admin");
  const activeBrand = brandsQ.data?.brands.find((b: any) => b.id === brandsQ.data?.activeBrandId);

  useEffect(() => {
    if (profileQ.data && (profileQ.data as any).onboarding_complete === false && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profileQ.data, pathname, navigate]);

  const nav = isAdmin
    ? [...baseNav, { to: "/admin", label: "Admin", icon: Shield } as const]
    : baseNav;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar p-4 md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-bold">ContentNaija AI</span>
        </Link>

        {activeBrand && (
          <Link to="/brands" className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs hover:bg-accent">
            <span className="h-3 w-3 rounded-full" style={{ background: activeBrand.brand_color || "#10B981" }} />
            <span className="flex-1 truncate"><span className="text-muted-foreground">Brand: </span>{activeBrand.name}</span>
          </Link>
        )}

        <nav className="mt-6 flex-1 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>

        <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </aside>

      <div className="flex w-full flex-col">
        <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Open menu" className="h-9 w-9 shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b border-border p-4">
                  <SheetTitle className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-primary">
                      <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                    </span>
                    ContentNaija AI
                  </SheetTitle>
                </SheetHeader>
                {activeBrand && (
                  <Link to="/brands" onClick={() => setMenuOpen(false)} className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: activeBrand.brand_color || "#10B981" }} />
                    <span className="min-w-0 flex-1 truncate"><span className="text-muted-foreground">Brand: </span>{activeBrand.name}</span>
                  </Link>
                )}
                <nav className="mt-4 flex flex-col gap-1 px-2 pb-4">
                  {nav.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-accent"
                      activeProps={{ className: "bg-accent text-primary" }}
                    >
                      <n.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{n.label}</span>
                    </Link>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => { setMenuOpen(false); signOut(); }} className="mt-2 justify-start gap-2">
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </span>
              <span className="truncate text-sm font-bold">ContentNaija AI</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <LanguageSelector compact />
            {activeBrand && (
              <Link to="/brands" className="hidden items-center gap-1.5 rounded-full border border-border px-2 py-1 text-[11px] xs:flex">
                <span className="h-2 w-2 rounded-full" style={{ background: activeBrand.brand_color || "#10B981" }} />
                <span className="max-w-[70px] truncate">{activeBrand.name}</span>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
