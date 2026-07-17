/**
 * Unit tests for the shared severity mapping.
 *
 * Layer: unit.
 * Goal: pin the label/class treatment per severity level and every branch of
 *   the two status-to-severity mappers.
 * Mocks: none. All three exports are pure.
 */

import { describe, expect, it } from 'vitest'

import { severityForHealthStatus, severityForHttpStatus, severityStyle } from './severity'

describe('severityStyle', () => {
  /**
   * Style pin, one case per severity level.
   *
   * Each level's label and Tailwind classes are part of the shared visual
   * contract; a change here should be a deliberate, reviewed edit.
   */
  it.each([
    ['ok', 'OK', 'bg-(--color-success)', 'text-(--color-success)'],
    ['warn', 'WARN', 'bg-(--color-accent)', 'text-(--color-accent)'],
    ['error', 'ERROR', 'bg-(--color-danger)', 'text-(--color-danger)'],
  ] as const)(
    'maps %s to label %s with the matching dot and text classes',
    (severity, label, dot, text) => {
      expect(severityStyle(severity)).toEqual({
        label,
        dotClassName: dot,
        textClassName: text,
      })
    },
  )
})

describe('severityForHealthStatus', () => {
  /**
   * Up maps to ok.
   *
   * Protects the Health Console's CheckList: a healthy indicator must render
   * the green "OK" treatment.
   */
  it('returns ok for status up', () => {
    expect(severityForHealthStatus('up')).toBe('ok')
  })

  /**
   * Down maps to error.
   *
   * Protects the Health Console: a failing indicator must render the red
   * "ERROR" treatment, never a softer warning.
   */
  it('returns error for status down', () => {
    expect(severityForHealthStatus('down')).toBe('error')
  })
})

describe('severityForHttpStatus', () => {
  /**
   * 2xx/3xx maps to ok.
   *
   * Protects the Latency Lab's sample feed: successful requests must never
   * be flagged.
   */
  it.each([200, 201, 204, 304])('returns ok for status %d', (statusCode) => {
    expect(severityForHttpStatus(statusCode)).toBe('ok')
  })

  /**
   * 4xx maps to warn.
   *
   * Client errors (validation failures, not-found) are notable but not as
   * severe as a server failure.
   */
  it.each([400, 404, 429])('returns warn for status %d', (statusCode) => {
    expect(severityForHttpStatus(statusCode)).toBe('warn')
  })

  /**
   * 5xx maps to error, including the exact 500/400 boundary.
   *
   * Pins the `>= 500` / `>= 400` boundary conditions precisely so an
   * off-by-one mutation (`> 500`, `> 400`) is caught.
   */
  it.each([500, 502, 503])('returns error for status %d', (statusCode) => {
    expect(severityForHttpStatus(statusCode)).toBe('error')
  })
})
