interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-4',
}

export default function LoadingSpinner({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={`${sizes[size]} rounded-full border-brand-200 border-t-brand-600 animate-spin ${className}`}
    />
  )
}
