import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWord = true,
  size = 28,
}: {
  className?: string;
  showWord?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-soft">
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden
        >
          <path
            d="M16 3v26M9 7c0 4 2 5 2 9s-2 5-2 9M23 7c0 4-2 5-2 9s2 5 2 9"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showWord && (
        <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Vanguard
        </span>
      )}
    </span>
  );
}
