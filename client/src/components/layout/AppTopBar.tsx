import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTheme } from "../../context/ThemeContext";

type Props = {
  title?: string;
};

export default function AppTopBar({ title = "Dashboard" }: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="flex flex-shrink-0 flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"
      style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}
    >
      <h1 className="text-xl font-semibold tracking-tight text-[var(--app-text)]">
        {title}
      </h1>

      <div className="flex flex-1 items-center justify-end gap-3 sm:max-w-xl lg:max-w-2xl">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search shabad, raag, or course…"
            className="w-full rounded-full border-0 bg-[var(--app-page)] py-3 pl-12 pr-12 text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted)] outline-none ring-1 ring-[var(--app-border)] transition-shadow focus:ring-2 focus:ring-[var(--app-primary)]"
          />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[var(--app-muted)] transition hover:bg-black/5 hover:text-[var(--app-text)] dark:hover:bg-white/10"
                aria-label="Filters"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path d="M3 4h18M7 12h10M11 20h2" strokeLinecap="round" />
                </svg>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[200px] rounded-xl border bg-[var(--app-surface)] p-2 shadow-xl"
                style={{ borderColor: "var(--app-border)" }}
                align="end"
              >
                <p className="px-2 py-1.5 text-xs font-medium text-[var(--app-muted)]">
                  Quick filters
                </p>
                <DropdownMenu.Item className="cursor-pointer rounded-lg px-2 py-2 text-sm outline-none data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/10">
                  Gurbani only
                </DropdownMenu.Item>
                <DropdownMenu.Item className="cursor-pointer rounded-lg px-2 py-2 text-sm outline-none data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/10">
                  Video lessons
                </DropdownMenu.Item>
                <DropdownMenu.Item className="cursor-pointer rounded-lg px-2 py-2 text-sm outline-none data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/10">
                  Saved
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-[var(--app-text)] transition hover:bg-[var(--app-page)]"
          style={{ borderColor: "var(--app-border)" }}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
