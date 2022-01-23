import clsx from "clsx"
import React from "react"

type StatusDotProps = {
  title: string
  variant: "primary" | "danger" | "warning" | "success" | "default"
} & React.HTMLAttributes<HTMLDivElement>

const StatusDot: React.FC<StatusDotProps> = ({
  title,
  variant = "success",
  className,
  ...props
}) => {
  const dotClass = clsx({
    "bg-teal-50": variant === "success",
    "bg-rose-50": variant === "danger",
    "bg-yellow-50": variant === "warning",
    "bg-violet-60": variant === "primary",
    "bg-grey-40": variant === "default",
  })
  return (
    <div className={clsx("flex items-center", className)} {...props}>
      <div
        className={clsx("w-1.5 h-1.5 mr-2 self-center rounded-full", dotClass)}
      ></div>
      {title}
    </div>
  )
}

export default StatusDot
