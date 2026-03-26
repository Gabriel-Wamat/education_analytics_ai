import { Menu, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface TopbarAction {
  label: string;
  to: string;
  variant: "secondary" | "ghost";
}

interface TopbarProps {
  breadcrumb: string;
  title: string;
  description: string;
  primaryAction?: TopbarAction;
  secondaryAction?: TopbarAction;
  onOpenNavigation: () => void;
}

const TopbarLink = ({ action }: { action: TopbarAction }) => (
  <Link
    to={action.to}
    className={
      action.variant === "ghost"
        ? "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/8 hover:text-white"
        : "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 text-sm font-semibold text-white transition hover:bg-white/12"
    }
  >
    {action.label}
  </Link>
);

export const Topbar = ({
  breadcrumb,
  title,
  primaryAction,
  secondaryAction,
  onOpenNavigation
}: TopbarProps) => {
  return (
    <header className="sticky top-0 z-30">
      <div className="w-full pb-3">
        <div className="w-full rounded-[24px] border border-mid-blue/70 bg-primary-dark px-4 py-3 shadow-sm md:px-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={onOpenNavigation}
                aria-label="Abrir menu principal"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/8 text-white shadow-sm transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  <span className="truncate">{breadcrumb}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-white">{title}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 md:flex">
                {secondaryAction ? <TopbarLink action={secondaryAction} /> : null}
                {primaryAction ? <TopbarLink action={primaryAction} /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
