/**
 * Component tests for `TriggerResponsePanel`.
 *
 * Layer: component.
 * Goal: verify the idle state renders nothing, an envelope response renders
 *   the shared `EnvelopeViewer`, and a transport response renders the raw
 *   failure message.
 * Mocks: none. Pure presentational rendering.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TriggerResponsePanel } from './trigger-response-panel'
import type { Trigger } from './triggers'

const SAMPLE_TRIGGER: Trigger = {
  id: 'bad-request',
  label: 'Bad Request',
  expectedCode: 'BYMAX_BAD_REQUEST',
  statusCode: 400,
  group: '4xx',
  run: () => Promise.resolve({ ok: true, data: undefined }),
}

describe('TriggerResponsePanel', () => {
  /**
   * Idle state.
   *
   * Before any trigger has fired, the panel renders nothing.
   */
  it('renders nothing while idle', () => {
    const { container } = render(<TriggerResponsePanel response={{ kind: 'idle' }} />)
    expect(container).toBeEmptyDOMElement()
  })

  /**
   * Envelope response.
   *
   * Renders the trigger's label as the heading and the envelope via the
   * shared viewer.
   */
  it('renders the trigger label and the envelope viewer for an envelope response', () => {
    render(
      <TriggerResponsePanel
        response={{
          kind: 'envelope',
          trigger: SAMPLE_TRIGGER,
          envelope: {
            statusCode: 400,
            code: 'BYMAX_BAD_REQUEST',
            message: 'Demo bad request failure',
            timestamp: 't',
            path: '/failures/bad-request',
          },
        }}
      />,
    )

    expect(screen.getByText('Response: Bad Request')).toBeInTheDocument()
    expect(screen.getByText('"statusCode"')).toBeInTheDocument()
  })

  /**
   * Transport response.
   *
   * Renders the raw failure message instead of the envelope viewer.
   */
  it('renders the raw message for a transport response', () => {
    render(
      <TriggerResponsePanel
        response={{ kind: 'transport', trigger: SAMPLE_TRIGGER, message: 'Failed to fetch' }}
      />,
    )

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
  })
})
