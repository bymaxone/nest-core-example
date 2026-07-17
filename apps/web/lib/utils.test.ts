/**
 * Unit tests for the `cn` class-name merge helper.
 *
 * Layer: unit.
 * Goal: verify conditional composition and Tailwind conflict resolution.
 * Mocks: none. `cn` is pure.
 */

import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  /**
   * Plain concatenation.
   *
   * Multiple string arguments join with a single space, the base case every
   * component's `className` composition relies on.
   */
  it('joins plain string arguments with a space', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  /**
   * Conditional object form.
   *
   * A falsy-keyed entry in the clsx object form is omitted entirely, so
   * conditional classes (`{ 'is-active': isActive }`) work as expected.
   */
  it('omits keys with a falsy value in the object form', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })

  /**
   * Tailwind conflict resolution.
   *
   * When two classes target the same CSS property, `tailwind-merge` keeps
   * only the last one: this is what lets a caller override a component's
   * default padding via `className` without `!important`.
   */
  it('resolves a Tailwind utility conflict by keeping the last class', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})
