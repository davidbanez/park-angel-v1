import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: '',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        outline: '',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      },
      color: {
        primary: '',
        red: '',
        green: '',
        blue: '',
        gray: '',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    compoundVariants: [
      // Primary variant colors
      {
        variant: 'primary',
        color: 'primary',
        class: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      },
      {
        variant: 'primary',
        color: 'red',
        class: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      },
      {
        variant: 'primary',
        color: 'green',
        class: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      },
      {
        variant: 'primary',
        color: 'blue',
        class: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      },
      {
        variant: 'primary',
        color: 'gray',
        class: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      },
      // Outline variant colors
      {
        variant: 'outline',
        color: 'primary',
        class: 'border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white focus:ring-primary-500',
      },
      {
        variant: 'outline',
        color: 'red',
        class: 'border border-red-600 text-red-600 hover:bg-red-600 hover:text-white focus:ring-red-500',
      },
      {
        variant: 'outline',
        color: 'green',
        class: 'border border-green-600 text-green-600 hover:bg-green-600 hover:text-white focus:ring-green-500',
      },
      {
        variant: 'outline',
        color: 'blue',
        class: 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500',
      },
      {
        variant: 'outline',
        color: 'gray',
        class: 'border border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white focus:ring-gray-500',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      color: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, color, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, color, size, className })}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
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
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'