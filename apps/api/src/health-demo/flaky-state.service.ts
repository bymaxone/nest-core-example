/**
 * @fileoverview Mutable readiness state for the flaky demo health indicator.
 * The toggle controller writes this state and the flaky indicator reads it, so
 * the demonstration can drive readiness from 200 to 503 and back at runtime
 * without restarting the process, and neither collaborator depends on the other.
 * @layer service
 */

import { Injectable } from '@nestjs/common'

/** The two readiness states the flaky demo indicator can report. */
export type FlakyStatus = 'up' | 'down'

/**
 * Holds the readiness state the flaky demo indicator reports. Shared between
 * the toggle controller (writer) and the indicator (reader).
 */
@Injectable()
export class FlakyStateService {
  /** Current readiness the flaky indicator reports. Starts healthy. */
  private status: FlakyStatus = 'up'

  /** ISO 8601 instant the state was last set; initialized at construction. */
  private toggledAt: string = new Date().toISOString()

  /**
   * Set the readiness the flaky indicator will report on its next check.
   *
   * @param status - The new readiness state.
   * @returns The stored state after the change.
   */
  setStatus(status: FlakyStatus): FlakyStatus {
    this.status = status
    this.toggledAt = new Date().toISOString()
    return this.status
  }

  /**
   * Read the current readiness state.
   *
   * @returns The state the flaky indicator should report.
   */
  getStatus(): FlakyStatus {
    return this.status
  }

  /**
   * Read the instant the readiness state was last set.
   *
   * @returns An ISO 8601 timestamp of the last change.
   */
  getToggledAt(): string {
    return this.toggledAt
  }
}
