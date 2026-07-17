/**
 * Unit tests for the `useErrorTrigger` hook.
 *
 * Layer: hook.
 * Goal: verify the idle -> envelope, idle -> transport (both the
 *   unexpected-success and genuine-failure paths), and unknown-id branches,
 *   plus that `activeId` is set during the request and cleared afterward.
 * Mocks: `TRIGGERS` from `components/errors/triggers`, each entry's `run`
 *   replaced with a controllable mock.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useErrorTrigger } from './use-error-trigger'
import { TRIGGERS } from '@/components/errors/triggers'

describe('useErrorTrigger', () => {
  /**
   * Unknown trigger id.
   *
   * An id that matches no registered trigger must no-op: `activeId` never
   * flips and the response stays idle.
   */
  it('does nothing when the trigger id is unknown', () => {
    const { result } = renderHook(() => useErrorTrigger())

    act(() => result.current.handleTrigger('does-not-exist'))

    expect(result.current.response).toEqual({ kind: 'idle' })
    expect(result.current.activeId).toBeNull()
  })

  /**
   * Envelope response.
   *
   * A registered trigger's envelope-kind failure becomes the `envelope`
   * response state, and `activeId` clears once the request settles.
   */
  it('records an envelope response and clears activeId when the request settles', async () => {
    // Arrange
    const trigger = TRIGGERS[0]
    if (!trigger) throw new Error('expected at least one trigger')
    const envelope = {
      statusCode: 400,
      code: 'BYMAX_BAD_REQUEST',
      message: 'Demo bad request failure',
      timestamp: 't',
      path: '/failures/bad-request',
    }
    const runSpy = vi
      .spyOn(trigger, 'run')
      .mockResolvedValue({ ok: false, kind: 'envelope', error: envelope })

    // Act
    const { result } = renderHook(() => useErrorTrigger())
    act(() => result.current.handleTrigger(trigger.id))

    // Assert
    await waitFor(() => expect(result.current.activeId).toBeNull())
    expect(result.current.response).toEqual({ kind: 'envelope', trigger, envelope })

    runSpy.mockRestore()
  })

  /**
   * Transport failure.
   *
   * A transport-kind failure becomes the `transport` response state with
   * the client's message.
   */
  it('records a transport response with the failure message', async () => {
    // Arrange
    const trigger = TRIGGERS[0]
    if (!trigger) throw new Error('expected at least one trigger')
    const runSpy = vi
      .spyOn(trigger, 'run')
      .mockResolvedValue({ ok: false, kind: 'transport', message: 'Failed to fetch' })

    // Act
    const { result } = renderHook(() => useErrorTrigger())
    act(() => result.current.handleTrigger(trigger.id))

    // Assert
    await waitFor(() =>
      expect(result.current.response).toEqual({
        kind: 'transport',
        trigger,
        message: 'Failed to fetch',
      }),
    )

    runSpy.mockRestore()
  })

  /**
   * Unexpected success.
   *
   * Every trigger endpoint always fails by contract; if one ever resolves
   * `ok: true`, the hook must surface that as a transport-kind anomaly
   * rather than silently treating it as a success.
   */
  it('records an unexpected-success message when a trigger resolves ok', async () => {
    // Arrange
    const trigger = TRIGGERS[0]
    if (!trigger) throw new Error('expected at least one trigger')
    const runSpy = vi.spyOn(trigger, 'run').mockResolvedValue({ ok: true, data: undefined })

    // Act
    const { result } = renderHook(() => useErrorTrigger())
    act(() => result.current.handleTrigger(trigger.id))

    // Assert
    await waitFor(() =>
      expect(result.current.response).toEqual({
        kind: 'transport',
        trigger,
        message: 'Unexpected success (this endpoint always fails).',
      }),
    )

    runSpy.mockRestore()
  })
})
