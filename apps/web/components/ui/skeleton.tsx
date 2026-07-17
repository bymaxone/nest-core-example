/**
 * @fileoverview Skeleton primitive — glass shimmer placeholder for loading content.
 *
 * Per the design system's "skeletons, not spinners" rule: content fetches show
 * a pulsing glass block instead of a spinner; spinners are reserved for short
 * blocking actions (submit/save).
 *
 * @layer components/ui
 */

import { cn } from '@/lib/utils'

/**
 * Pulsing glass placeholder block, sized by the caller via `className`.
 *
 * @param className - Additional Tailwind classes controlling width/height/shape.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-(--glass-bg-raised) animate-pulse rounded-md', className)} {...props} />
  )
}

export { Skeleton }
