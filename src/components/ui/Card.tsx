import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  variant?: "elevated" | "outlined" | "flat" | "gradient";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  variant = "elevated",
  padding = "md",
  hover = false,
  className,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-card",
        "transition-all duration-base",

        // Variants
        variant === "elevated" && "bg-white shadow-card",
        variant === "outlined" && "bg-white border-2 border-gray-200",
        variant === "flat" && "bg-bg-secondary",
        variant === "gradient" && "bg-gradient-to-br from-primary-50 to-secondary-50",

        // Padding
        padding === "none" && "p-0",
        padding === "sm" && "p-4",
        padding === "md" && "p-6",
        padding === "lg" && "p-8",

        // Interactive
        hover && [
          "hover:shadow-card-hover hover:-translate-y-0.5",
          onClick ? "cursor-pointer" : "",
        ],

        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: string;
  className?: string;
}

export function CardHeader({ title, subtitle, action, icon, className }: CardHeaderProps) {
  return (
    <div className={clsx("flex items-start justify-between mb-4", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <span className="text-2xl leading-none">{icon}</span>
        )}
        <div>
          <h3 className="text-h3 text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-body-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  );
}
