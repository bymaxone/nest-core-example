/**
 * @fileoverview Generic two-option toggle card driving a demo health
 * indicator. Used for both the flaky indicator (`up`/`down`) and the
 * hanging indicator (`Disarm`/`Arm`), owning its own mutation and toast
 * feedback so the Health page only supplies the current value and the
 * request function.
 *
 * @layer components/health
 */

'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ApiResult } from '@/lib/api-client'

/** One selectable option on the toggle card. */
export interface ToggleOption<TValue extends string> {
  /** The value sent to `onToggle`. */
  readonly value: TValue
  /** Button label. */
  readonly label: string
}

interface ToggleCardProps<TValue extends string> {
  /** Card title, for example "Flaky indicator". */
  title: string
  /** The two selectable options, in display order. */
  options: readonly [ToggleOption<TValue>, ToggleOption<TValue>]
  /** The currently active value, or undefined while unknown. */
  activeValue: TValue | undefined
  /** Fires the toggle request for the selected value. */
  onToggle: (value: TValue) => Promise<ApiResult<unknown>>
  /** Called after a successful toggle so the parent can refetch readiness. */
  onToggled: () => void
}

/**
 * Two-button toggle card with mutation state and toast feedback.
 *
 * @param title - Card title.
 * @param options - The two selectable options.
 * @param activeValue - The currently active value.
 * @param onToggle - Fires the toggle request.
 * @param onToggled - Called after a successful toggle.
 */
export function ToggleCard<TValue extends string>({
  title,
  options,
  activeValue,
  onToggle,
  onToggled,
}: ToggleCardProps<TValue>) {
  const mutation = useMutation({
    mutationFn: onToggle,
    onSuccess: (result, value) => {
      if (result.ok) {
        toast.success(`${title}: set to ${value}`)
        onToggled()
      } else if (result.kind === 'transport') {
        toast.error(result.message)
      }
    },
  })

  return (
    <Card>
      <CardHeader accent>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={activeValue === option.value ? 'default' : 'outline'}
            size="sm"
            disabled={mutation.isPending}
            className={cn(activeValue === option.value && 'pointer-events-none')}
            onClick={() => mutation.mutate(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
