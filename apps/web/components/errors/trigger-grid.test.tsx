/**
 * Component tests for `TriggerGrid`.
 *
 * Layer: component.
 * Goal: verify group headings render, a card click calls back with its id,
 *   every card disables while a trigger is in flight, and the domain-code
 *   card carries its distinct badge variant.
 * Mocks: none. `run` functions are never invoked; only `onTrigger` is spied.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { TriggerGrid } from './trigger-grid'
import type { Trigger } from './triggers'

const SAMPLE_TRIGGERS: readonly Trigger[] = [
  {
    id: 'bad-request',
    label: 'Bad Request',
    expectedCode: 'BYMAX_BAD_REQUEST',
    statusCode: 400,
    group: '4xx',
    run: () => Promise.resolve({ ok: true, data: undefined }),
  },
  {
    id: 'internal',
    label: 'Internal Server Error',
    expectedCode: 'BYMAX_INTERNAL_ERROR',
    statusCode: 500,
    group: '5xx',
    run: () => Promise.resolve({ ok: true, data: undefined }),
  },
  {
    id: 'seasonal',
    label: 'Seasonal (custom code)',
    expectedCode: 'CATALOG_OUT_OF_SEASON',
    statusCode: 409,
    group: 'special',
    run: () => Promise.resolve({ ok: true, data: undefined }),
    isDomainCode: true,
  },
]

describe('TriggerGrid', () => {
  /**
   * Group headings and card labels.
   *
   * Every populated group renders its heading, and every card renders its
   * label, expected code, and status.
   */
  it('renders a heading per populated group and every card', () => {
    render(<TriggerGrid triggers={SAMPLE_TRIGGERS} activeId={null} onTrigger={vi.fn()} />)

    expect(screen.getByText('Client errors (4xx)')).toBeInTheDocument()
    expect(screen.getByText('Server errors (5xx)')).toBeInTheDocument()
    expect(screen.getByText('Special cases')).toBeInTheDocument()
    expect(screen.getByText('Bad Request')).toBeInTheDocument()
    expect(screen.getByText('BYMAX_INTERNAL_ERROR')).toBeInTheDocument()
    expect(screen.getByText('409')).toBeInTheDocument()
  })

  /**
   * Empty group omission.
   *
   * A group with no matching triggers renders no heading at all, rather
   * than an empty section.
   */
  it('omits the heading for a group with no matching triggers', () => {
    render(
      <TriggerGrid
        triggers={[SAMPLE_TRIGGERS[0] as Trigger]}
        activeId={null}
        onTrigger={vi.fn()}
      />,
    )

    expect(screen.getByText('Client errors (4xx)')).toBeInTheDocument()
    expect(screen.queryByText('Server errors (5xx)')).not.toBeInTheDocument()
    expect(screen.queryByText('Special cases')).not.toBeInTheDocument()
  })

  /**
   * Click callback.
   *
   * Clicking a card calls `onTrigger` with that card's id, not any other.
   */
  it('calls onTrigger with the clicked card id', () => {
    const onTrigger = vi.fn()
    render(<TriggerGrid triggers={SAMPLE_TRIGGERS} activeId={null} onTrigger={onTrigger} />)

    fireEvent.click(screen.getByText('Bad Request'))

    expect(onTrigger).toHaveBeenCalledWith('bad-request')
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  /**
   * In-flight disabling.
   *
   * While any trigger is active (`activeId` set), every card, including
   * ones other than the active one, is disabled to prevent overlapping
   * requests.
   */
  it('disables every card while a trigger is active', () => {
    render(<TriggerGrid triggers={SAMPLE_TRIGGERS} activeId="internal" onTrigger={vi.fn()} />)

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })

  /**
   * Domain-code visual distinction.
   *
   * The `seasonal` card renders the `secondary` badge variant class instead
   * of the default `outline` treatment every `BYMAX_*` card uses.
   */
  it('renders the domain-code card with the secondary badge variant', () => {
    render(<TriggerGrid triggers={SAMPLE_TRIGGERS} activeId={null} onTrigger={vi.fn()} />)

    const badge = screen.getByText('CATALOG_OUT_OF_SEASON')
    expect(badge.className).toContain('bg-secondary')
  })
})
