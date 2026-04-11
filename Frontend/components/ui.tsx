import React, { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Button = React.forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive' }>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          "h-9 px-4 py-2",
          variant === 'default' && "bg-white text-black hover:bg-neutral-200",
          variant === 'outline' && "border border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-100",
          variant === 'ghost' && "hover:bg-neutral-800 text-neutral-300 hover:text-white",
          variant === 'destructive' && "bg-red-500 text-white hover:bg-red-600",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"


export const Card = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-xl text-neutral-100 shadow-sm", className)} {...props} />
))
Card.displayName = "Card"

export const Badge = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'success' | 'destructive' | 'outline' }>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div ref={ref} className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === 'default' && "border-transparent bg-neutral-800 text-neutral-100",
      variant === 'success' && "border-transparent bg-green-500/20 text-green-400",
      variant === 'destructive' && "border-transparent bg-red-500/20 text-red-400",
      variant === 'outline' && "border-neutral-700 text-neutral-300",
      className
    )} {...props} />
  )
)
Badge.displayName = "Badge"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 text-white",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
