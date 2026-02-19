import { forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      icon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          // Base
          "inline-flex items-center justify-center gap-2",
          "font-semibold rounded-button",
          "transition-all duration-base",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "active:scale-[0.98]",

          // Variants
          variant === "primary" && [
            "bg-primary-500 text-white",
            "hover:bg-primary-600 shadow-orange",
            "focus-visible:ring-primary-500",
            "disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed",
          ],
          variant === "secondary" && [
            "bg-secondary-500 text-white",
            "hover:bg-secondary-600",
            "focus-visible:ring-secondary-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ],
          variant === "outline" && [
            "border-2 border-primary-500 text-primary-500 bg-transparent",
            "hover:bg-primary-50",
            "focus-visible:ring-primary-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ],
          variant === "ghost" && [
            "text-gray-700 bg-transparent",
            "hover:bg-gray-100",
            "focus-visible:ring-gray-400",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ],
          variant === "danger" && [
            "bg-error text-white",
            "hover:bg-red-600",
            "focus-visible:ring-error",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ],

          // Sizes
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-5 py-2.5 text-base",
          size === "lg" && "px-7 py-3.5 text-lg",

          // Width
          fullWidth && "w-full",

          className
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
