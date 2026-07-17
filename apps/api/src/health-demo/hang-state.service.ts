/**
 * @fileoverview Mutable arm state for the hanging demo health indicator. When
 * armed, the hanging indicator sleeps past the configured per-indicator timeout
 * so the library reports it down by timeout; the toggle controller arms and
 * disarms it at runtime.
 * @layer service
 */

import { Injectable } from '@nestjs/common'

/**
 * Holds whether the hanging demo indicator is currently armed. Shared between
 * the toggle controller (writer) and the indicator (reader).
 */
@Injectable()
export class HangStateService {
  /** When true, the next hanging check sleeps past the indicator timeout. */
  private armed = false

  /**
   * Arm or disarm the hanging indicator.
   *
   * @param armed - True to make the next check hang past the timeout.
   * @returns The stored armed flag after the change.
   */
  setArmed(armed: boolean): boolean {
    this.armed = armed
    return this.armed
  }

  /**
   * Read whether the hanging indicator is currently armed.
   *
   * @returns True when the next check will hang past the timeout.
   */
  isArmed(): boolean {
    return this.armed
  }
}
