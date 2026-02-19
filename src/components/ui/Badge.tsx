import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "error" | "gray";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "gray",
  size = "md",
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-medium rounded-pill",

        // Variants
        variant === "primary" && "bg-primary-100 text-primary-700",
        variant === "secondary" && "bg-secondary-100 text-secondary-700",
        variant === "success" && "bg-success-light text-green-700",
        variant === "warning" && "bg-warning-light text-amber-700",
        variant === "error" && "bg-error-light text-red-700",
        variant === "gray" && "bg-gray-100 text-gray-700",

        // Sizes
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",

        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full shrink-0",
            variant === "primary" && "bg-primary-500",
            variant === "secondary" && "bg-secondary-500",
            variant === "success" && "bg-garden-primary",
            variant === "warning" && "bg-warning",
            variant === "error" && "bg-error",
            variant === "gray" && "bg-gray-400"
          )}
        />
      )}
      {children}
    </span>
  );
}
