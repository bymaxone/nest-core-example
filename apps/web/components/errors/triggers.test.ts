/**
 * Unit tests for the Errors page's trigger catalog.
 *
 * Layer: unit.
 * Goal: pin the full 19-card catalog (16 failure kinds + 3 catalog-driven
 *   demos) and its `id`/`group` shape, and verify the one domain-code card
 *   is flagged distinctly from every `BYMAX_*` card.
 * Mocks: none. `TRIGGERS` is a static array; `run` functions are not invoked.
 */

import { describe, expect, it } from 'vitest'

import { TRIGGERS } from './triggers'

describe('TRIGGERS', () => {
  /**
   * Full catalog size.
   *
   * 8 4xx + 5 5xx + 6 special (teapot, variant-5xx, unknown, validation,
   * not-found, seasonal) = 19 cards, covering every §7.3 derivation.
   */
  it('has exactly 19 trigger cards', () => {
    expect(TRIGGERS).toHaveLength(19)
  })

  /**
   * Unique ids.
   *
   * Every card's id doubles as its React key; a duplicate would silently
   * drop a card from the rendered grid.
   */
  it('has a unique id per trigger', () => {
    const ids = TRIGGERS.map((trigger) => trigger.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  /**
   * Group membership counts.
   *
   * Pins the exact 8/5/6 split across the three visual groups.
   */
  it('groups triggers into 8 client, 5 server, and 6 special cards', () => {
    const byGroup = (group: '4xx' | '5xx' | 'special') =>
      TRIGGERS.filter((trigger) => trigger.group === group).length

    expect(byGroup('4xx')).toBe(8)
    expect(byGroup('5xx')).toBe(5)
    expect(byGroup('special')).toBe(6)
  })

  /**
   * Domain-code isolation.
   *
   * Exactly one card (`seasonal`) is flagged `isDomainCode`, and it is the
   * only one whose `expectedCode` falls outside the `BYMAX_` namespace.
   */
  it('flags exactly the seasonal card as the custom domain code', () => {
    const domainCodeTriggers = TRIGGERS.filter((trigger) => trigger.isDomainCode === true)
    expect(domainCodeTriggers.map((trigger) => trigger.id)).toEqual(['seasonal'])
    expect(domainCodeTriggers[0]?.expectedCode.startsWith('BYMAX_')).toBe(false)
  })

  /**
   * BYMAX_ namespace for every other card.
   *
   * Every card not flagged as a domain code must expect a `BYMAX_`-prefixed
   * code, since it is either a standard derivation or a fallback.
   */
  it('expects a BYMAX_-prefixed code for every non-domain-code card', () => {
    const standardTriggers = TRIGGERS.filter((trigger) => trigger.isDomainCode !== true)
    for (const trigger of standardTriggers) {
      expect(trigger.expectedCode.startsWith('BYMAX_')).toBe(true)
    }
  })
})
