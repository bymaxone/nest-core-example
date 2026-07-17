/**
 * @fileoverview The flaky and hanging demo toggles, side by side.
 *
 * @layer components/health
 */

import { toggleFlaky, toggleHang } from '@/lib/health-api'
import { ToggleCard } from './toggle-card'

const FLAKY_OPTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
] as const

const HANG_OPTIONS = [
  { value: 'false', label: 'Disarm' },
  { value: 'true', label: 'Arm' },
] as const

interface HealthTogglesProps {
  /** The flaky indicator's current status, or undefined before readiness resolves. */
  flakyStatus: 'up' | 'down' | undefined
  /**
   * The hanging indicator's current status. The indicator has no separate
   * "armed" field: once armed, every readiness check sleeps past the
   * timeout and is reported down until disarmed, so its up/down status
   * doubles as the armed/disarmed toggle state.
   */
  hangStatus: 'up' | 'down' | undefined
  /** Called after either toggle succeeds so the parent can refetch readiness. */
  onToggled: () => void
}

/**
 * Side-by-side flaky and hanging toggle cards.
 *
 * @param flakyStatus - The flaky indicator's current status.
 * @param hangStatus - The hanging indicator's current status.
 * @param onToggled - Called after either toggle succeeds.
 */
export function HealthToggles({ flakyStatus, hangStatus, onToggled }: HealthTogglesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ToggleCard
        title="Flaky indicator"
        options={FLAKY_OPTIONS}
        activeValue={flakyStatus}
        onToggle={(value) => toggleFlaky(value)}
        onToggled={onToggled}
      />
      <ToggleCard
        title="Hanging indicator"
        options={HANG_OPTIONS}
        activeValue={hangStatus ? (hangStatus === 'down' ? 'true' : 'false') : undefined}
        onToggle={(value) => toggleHang(value === 'true')}
        onToggled={onToggled}
      />
    </div>
  )
}
