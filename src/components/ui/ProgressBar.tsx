import { clsx } from "clsx";

interface ProgressBarProps {
  value: number;
  max: number;
  color?: "primary" | "success" | "warning" | "secondary";
  showLabel?: boolean;
  label?: string;
  height?: "xs" | "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max,
  color = "primary",
  showLabel = false,
  label,
  height = "md",
  animated = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={clsx("w-full", className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-body-sm mb-1.5">
          <span className="text-gray-600 font-medium">{label ?? value}</span>
          <span className="text-gray-400">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={clsx(
          "w-full bg-gray-200 rounded-full overflow-hidden",
          height === "xs" && "h-1",
          height === "sm" && "h-1.5",
          height === "md" && "h-2.5",
          height === "lg" && "h-4"
        )}
      >
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-slow",
            animated && "animate-pulse",
            color === "primary" && "bg-primary-500",
            color === "success" && "bg-garden-primary",
            color === "warning" && "bg-warning",
            color === "secondary" && "bg-secondary-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
