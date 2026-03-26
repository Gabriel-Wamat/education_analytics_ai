import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  FileCheck2,
  WandSparkles,
  X
} from "lucide-react";
import { Link, Outlet, matchPath, useLocation } from "react-router-dom";

import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/cn";

type NavigationLinkItem = {
  to: string;
  label: string;
  description: string;
  icon: typeof ClipboardList;
};

const navigationSections: Array<{
  label: string;
  items: NavigationLinkItem[];
}> = [
  {
    label: "Principal",
    items: [
      {
        to: "/questions",
        label: "Questões",
        description: "Banco e revisão",
        icon: ClipboardList
      },
      {
        to: "/exam-templates/new",
        label: "Nova prova",
        description: "Montagem guiada",
        icon: WandSparkles
      },
      {
        to: "/grading",
        label: "Correção",
        description: "Notas e processamento",
        icon: FileCheck2,
      },
      {
        to: "/dashboard",
        label: "Dashboard",
        description: "Métricas e insights",
        icon: BarChart3
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

const isNavigationItemActive = (pathname: string, path: string) => {
  if (path === "/dashboard") {
    return Boolean(
      matchPath({ path: "/dashboard", end: true }, pathname) ||
        matchPath({ path: "/exams/:examId", end: true }, pathname)
    );
  }

  return Boolean(matchPath({ path, end: true }, pathname));
};

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
    <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
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

const MinimalLogo = () => (
  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/6">
    <span className="absolute left-[13px] top-[11px] h-5 w-[3px] rounded-full bg-white" />
    <span className="absolute left-[20px] top-[14px] h-4 w-[3px] rounded-full bg-white/80" />
    <span className="absolute left-[27px] top-[9px] h-7 w-[3px] rounded-full bg-white/55" />
  </div>
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
        "group relative flex items-center gap-3 border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "mx-auto h-11 w-11 justify-center rounded-[18px] px-0" : "h-14 rounded-2xl px-3.5",
        isActive
          ? collapsed
            ? "border-transparent bg-white/6 text-white"
            : "border-white/12 bg-white/10 text-white shadow-sm"
          : "border-transparent text-slate-300 hover:bg-white/6 hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] transition-all duration-300",
          isActive
            ? "bg-white text-primary-dark shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            : "bg-white/6 text-slate-300"
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

const SidebarContent = ({
  pathname,
  collapsed,
  mobile,
  onNavigate
}: {
  pathname: string;
  collapsed: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}) => {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[20px] border border-mid-blue/70 bg-primary-dark text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)] transition-[padding,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        mobile ? "w-full max-w-[320px] px-4 py-4" : collapsed ? "px-3 py-4" : "px-4 py-4.5"
      )}
    >
      <div className={cn("pb-5", collapsed && !mobile ? "px-0 pt-3" : "px-1.5 pt-3")}>
        <div
          className={cn(
            "flex items-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            collapsed && !mobile ? "justify-center" : "gap-3.5"
          )}
        >
          <MinimalLogo />
          {!collapsed || mobile ? (
            <div className={labelVisibilityClass(false)}>
              <div className="truncate text-[1.625rem] font-semibold tracking-[-0.03em] text-white">
                Provas
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-2 border-t border-white/10" />

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navigationSections.map((section) => (
          <div key={section.label} className="space-y-2.5">
            <SidebarSectionLabel label={section.label} collapsed={collapsed && !mobile} />
            <div className="space-y-2">
              {section.items.map((item) => (
                <SidebarLink
                  key={item.to}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed && !mobile}
                  onNavigate={onNavigate}
                />
              ))}
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
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(false);

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
        data-testid="desktop-sidebar"
        onMouseEnter={() => setDesktopSidebarExpanded(true)}
        onMouseLeave={() => setDesktopSidebarExpanded(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
          desktopSidebarExpanded ? "w-[286px]" : "w-[104px]"
        )}
      >
        <div className="h-full overflow-hidden px-4 py-4">
          <SidebarContent
            pathname={pathname}
            collapsed={!desktopSidebarExpanded}
          />
        </div>
      </aside>

      <div
        className={cn(
          "min-h-screen transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          desktopSidebarExpanded ? "lg:pl-[286px]" : "lg:pl-[104px]"
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
