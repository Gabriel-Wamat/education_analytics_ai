import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  WandSparkles,
  X
} from "lucide-react";
import { Link, Outlet, matchPath, useLocation } from "react-router-dom";

import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/cn";

type NavigationLinkItem = {
  type: "link";
  to: string;
  label: string;
  description: string;
  icon: typeof ClipboardList;
};

type NavigationGroupItem = {
  type: "group";
  id: string;
  label: string;
  description: string;
  icon: typeof FileCheck2;
  children: NavigationLinkItem[];
};

type NavigationItem = NavigationLinkItem | NavigationGroupItem;

const navigationSections: Array<{
  label: string;
  items: NavigationItem[];
}> = [
  {
    label: "Principal",
    items: [
      {
        type: "link",
        to: "/questions",
        label: "Questões",
        description: "Banco e revisão",
        icon: ClipboardList
      },
      {
        type: "link",
        to: "/exam-templates/new",
        label: "Nova prova",
        description: "Montagem guiada",
        icon: WandSparkles
      },
      {
        type: "group",
        id: "assessment",
        label: "Avaliação",
        description: "Correção e analytics",
        icon: FileCheck2,
        children: [
          {
            type: "link",
            to: "/grading",
            label: "Correção",
            description: "Notas e processamento",
            icon: FileCheck2
          },
          {
            type: "link",
            to: "/dashboard",
            label: "Dashboard",
            description: "Métricas e insights",
            icon: BarChart3
          }
        ]
      }
    ]
  }
];

const routeMeta = [
  {
    pattern: "/dashboard",
    breadcrumb: "Analytics educacional",
    title: "Dashboard analítico",
    description: "Estrutura pronta para receber métricas e insights assim que houver correções.",
    primaryAction: { label: "Ir para correção", to: "/grading", variant: "secondary" as const },
    secondaryAction: { label: "Nova prova", to: "/exam-templates/new", variant: "secondary" as const }
  },
  {
    pattern: "/exams/:examId",
    breadcrumb: "Analytics educacional",
    title: "Dashboard da prova",
    description: "Métricas agregadas, desempenho da turma e insights pedagógicos.",
    primaryAction: { label: "Voltar para correção", to: "/grading", variant: "secondary" as const },
    secondaryAction: { label: "Nova prova", to: "/exam-templates/new", variant: "secondary" as const }
  },
  {
    pattern: "/grading",
    breadcrumb: "Correção e relatórios",
    title: "Processamento da turma",
    description: "Envio de arquivos CSV, geração de notas e acesso ao dashboard.",
    primaryAction: { label: "Nova prova", to: "/exam-templates/new", variant: "secondary" as const },
    secondaryAction: { label: "Banco de questões", to: "/questions", variant: "ghost" as const }
  },
  {
    pattern: "/exam-templates/new",
    breadcrumb: "Montagem de prova",
    title: "Assistente de criação",
    description: "Selecione questões, configure o template e prepare os artefatos.",
    primaryAction: { label: "Banco de questões", to: "/questions", variant: "secondary" as const },
    secondaryAction: { label: "Correção", to: "/grading", variant: "ghost" as const }
  },
  {
    pattern: "/questions",
    breadcrumb: "Operação acadêmica",
    title: "Banco de questões",
    description: "Cadastre, revise e mantenha o catálogo usado na montagem das provas.",
    primaryAction: { label: "Nova prova", to: "/exam-templates/new", variant: "secondary" as const },
    secondaryAction: { label: "Correção", to: "/grading", variant: "ghost" as const }
  }
];

const SIDEBAR_STORAGE_KEY = "sgp.sidebar-collapsed.v4";

const isNavigationItemActive = (pathname: string, path: string) => {
  if (path === "/dashboard") {
    return Boolean(
      matchPath({ path: "/dashboard", end: true }, pathname) ||
        matchPath({ path: "/exams/:examId", end: true }, pathname)
    );
  }

  return Boolean(matchPath({ path, end: true }, pathname));
};

const isGroupActive = (pathname: string, item: NavigationGroupItem) =>
  item.children.some((child) => isNavigationItemActive(pathname, child.to));

const SidebarSectionLabel = ({
  label,
  collapsed
}: {
  label: string;
  collapsed: boolean;
}) =>
  collapsed ? (
    <div className="mx-auto h-px w-8 rounded-full bg-white/12" />
  ) : (
    <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
      {label}
    </div>
  );

const SidebarTooltip = ({ label }: { label: string }) => (
  <span className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 z-20 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-lg group-hover:block">
    {label}
  </span>
);

const labelVisibilityClass = (hidden: boolean) =>
  cn(
    "min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
    hidden ? "max-w-0 -translate-x-2 opacity-0" : "max-w-[220px] translate-x-0 opacity-100"
  );

const SidebarLink = ({
  item,
  pathname,
  collapsed,
  onNavigate
}: {
  item: NavigationLinkItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) => {
  const Icon = item.icon;
  const isActive = isNavigationItemActive(pathname, item.to);

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "mx-auto h-11 w-11 justify-center px-0" : "h-14 px-3.5",
        isActive
          ? "border-white/12 bg-white/10 text-white shadow-sm"
          : "border-transparent text-slate-300 hover:bg-white/6 hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-all duration-300",
          isActive ? "bg-white text-primary-dark" : "bg-white/6 text-slate-300"
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>

      <span className={cn("flex-1", labelVisibilityClass(collapsed))}>
        <span className="block truncate text-sm font-semibold leading-5">{item.label}</span>
      </span>

      {collapsed ? <SidebarTooltip label={item.label} /> : null}
    </Link>
  );
};

const SidebarGroup = ({
  item,
  pathname,
  collapsed,
  expanded,
  flyoutOpen,
  onToggle,
  onNavigate
}: {
  item: NavigationGroupItem;
  pathname: string;
  collapsed: boolean;
  expanded: boolean;
  flyoutOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) => {
  const Icon = item.icon;
  const active = isGroupActive(pathname, item);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-2xl border text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "mx-auto h-11 w-11 justify-center px-0" : "h-14 px-3.5",
          active || expanded || flyoutOpen
            ? "border-white/12 bg-white/10 text-white shadow-sm"
            : "border-transparent text-slate-300 hover:bg-white/6 hover:text-white"
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-all duration-300",
            active || expanded || flyoutOpen ? "bg-white text-primary-dark" : "bg-white/6 text-slate-300"
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>

        <span className={cn("flex-1", labelVisibilityClass(collapsed))}>
          <span className="block truncate text-sm font-semibold leading-5">{item.label}</span>
        </span>

        {!collapsed ? (
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")}
          />
        ) : null}

        {collapsed ? <SidebarTooltip label={item.label} /> : null}
      </button>

      {!collapsed ? (
        <div
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            expanded ? "mt-2 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="ml-6 border-l border-white/10 pl-4">
              <div className="space-y-1.5 py-1">
                {item.children.map((child) => {
                  const childActive = isNavigationItemActive(pathname, child.to);

                  return (
                    <Link
                      key={child.to}
                      to={child.to}
                      onClick={onNavigate}
                      className={cn(
                        "block rounded-xl px-3 py-2.5 text-sm transition",
                        childActive
                          ? "bg-white/10 font-semibold text-white"
                          : "text-slate-400 hover:bg-white/6 hover:text-white"
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {collapsed && flyoutOpen ? (
        <div className="surface-elevated absolute left-[calc(100%+16px)] top-1/2 z-30 w-60 -translate-y-1/2 p-3">
          <div className="mb-3 px-2">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {item.label}
            </div>
            <div className="mt-1 text-sm text-slate-600">{item.description}</div>
          </div>
          <div className="space-y-1">
            {item.children.map((child) => {
              const childActive = isNavigationItemActive(pathname, child.to);

              return (
                <Link
                  key={child.to}
                  to={child.to}
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 text-sm transition",
                    childActive
                      ? "bg-slate-100 font-semibold text-slate-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  )}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const SidebarContent = ({
  pathname,
  collapsed,
  onToggleCollapse,
  mobile,
  onNavigate
}: {
  pathname: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    assessment: isNavigationItemActive(pathname, "/grading") || isNavigationItemActive(pathname, "/dashboard")
  });
  const [flyoutGroupId, setFlyoutGroupId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isNavigationItemActive(pathname, "/grading") || isNavigationItemActive(pathname, "/dashboard")) {
      setExpandedGroups((current) => ({ ...current, assessment: true }));
    }
    setFlyoutGroupId(null);
  }, [pathname]);

  useEffect(() => {
    if (!collapsed || !flyoutGroupId) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setFlyoutGroupId(null);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [collapsed, flyoutGroupId]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[32px] border border-mid-blue/70 bg-primary-dark text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)] transition-[padding,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        mobile ? "w-full max-w-[320px] px-4 py-4" : collapsed ? "px-3 py-4" : "px-4 py-4.5"
      )}
    >
      {!mobile && onToggleCollapse ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          className="absolute -right-5 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-mid-blue/70 bg-primary-dark text-white shadow-sm transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] hover:bg-mid-blue"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      ) : null}

      <div className={cn("pb-4", collapsed && !mobile ? "px-0 pt-1" : "px-1.5 pt-1.5")}>
        <div
          className={cn(
            "flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            collapsed && !mobile ? "justify-center" : ""
          )}
        >
          <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-accent via-sky-300 to-highlight shadow-md" />
          <div className={labelVisibilityClass(collapsed && !mobile)}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Operação acadêmica
            </div>
            <div className="mt-1 truncate text-lg font-semibold text-white">Provas & Analytics</div>
            <p className="mt-0.5 text-xs text-slate-400">Criação, correção e leitura de desempenho.</p>
          </div>
        </div>
      </div>

      <div className="mx-2 border-t border-white/10" />

      <div className="mt-5 flex-1 space-y-4 overflow-y-auto px-1">
        {navigationSections.map((section) => (
          <div key={section.label} className="space-y-2.5">
            <SidebarSectionLabel label={section.label} collapsed={collapsed && !mobile} />
            <div className="space-y-2">
              {section.items.map((item) =>
                item.type === "link" ? (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed && !mobile}
                    onNavigate={onNavigate}
                  />
                ) : (
                  <SidebarGroup
                    key={item.id}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed && !mobile}
                    expanded={expandedGroups[item.id] ?? false}
                    flyoutOpen={flyoutGroupId === item.id}
                    onNavigate={onNavigate}
                    onToggle={() => {
                      if (collapsed && !mobile) {
                        setFlyoutGroupId((current) => (current === item.id ? null : item.id));
                        return;
                      }

                      setExpandedGroups((current) => ({
                        ...current,
                        [item.id]: !current[item.id]
                      }));
                    }}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AppShell = () => {
  const { pathname } = useLocation();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  });

  const currentRoute = useMemo(
    () =>
      routeMeta.find((item) => matchPath({ path: item.pattern, end: true }, pathname)) ??
      routeMeta[routeMeta.length - 1],
    [pathname]
  );

  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [pathname]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!mobileNavigationOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileNavigationOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
          sidebarCollapsed ? "w-[104px]" : "w-[286px]"
        )}
      >
        <div className="h-full px-4 py-4">
          <SidebarContent
            pathname={pathname}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          />
        </div>
      </aside>

      <div
        className={cn(
          "min-h-screen transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarCollapsed ? "lg:pl-[104px]" : "lg:pl-[286px]"
        )}
      >
        <div className="flex min-h-screen min-w-0 flex-col px-4 py-4 md:px-5 lg:px-6 lg:py-4">
          <Topbar
            breadcrumb={currentRoute.breadcrumb}
            title={currentRoute.title}
            description={currentRoute.description}
            primaryAction={currentRoute.primaryAction}
            secondaryAction={currentRoute.secondaryAction}
            onOpenNavigation={() => setMobileNavigationOpen(true)}
          />

          <main id="main-content" className="flex-1 py-5 md:py-6">
            <div className="w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {mobileNavigationOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-[color:var(--overlay-bg)] backdrop-blur-sm" />
          <button
            type="button"
            aria-label="Fechar menu principal"
            className="absolute inset-0"
            onClick={() => setMobileNavigationOpen(false)}
          />
          <aside className="relative h-full w-[88vw] max-w-[340px] p-4">
            <SidebarContent
              pathname={pathname}
              collapsed={false}
              mobile
              onNavigate={() => setMobileNavigationOpen(false)}
            />
            <button
              type="button"
              onClick={() => setMobileNavigationOpen(false)}
              className="absolute right-7 top-7 flex h-10 w-10 items-center justify-center rounded-2xl border border-mid-blue/70 bg-primary-dark text-white shadow-md"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </aside>
        </div>
      ) : null}
    </div>
  );
};
