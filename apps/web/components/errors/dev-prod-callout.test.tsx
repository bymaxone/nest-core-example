/**
 * Component tests for `DevProdCallout`.
 *
 * Layer: component.
 * Goal: verify the static explanation renders, pinning the key terms it
 *   must mention so a future edit cannot silently drop the accuracy fix
 *   made after live-verifying the actual dev-mode envelope shape.
 * Mocks: none. Static presentational rendering.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DevProdCallout } from './dev-prod-callout'

describe('DevProdCallout', () => {
  /**
   * Renders the dev-vs-prod explanation.
   *
   * Must mention both the exposeInternals flag and the production collapse,
   * matching what the running API actually does (verified live: dev mode
   * carries `details`, prod mode never does).
   */
  it('mentions ENVELOPE_EXPOSE_INTERNALS and the production collapse', () => {
    render(<DevProdCallout />)

    expect(screen.getByText('Dev vs. prod:')).toBeInTheDocument()
    expect(screen.getByText('ENVELOPE_EXPOSE_INTERNALS=true')).toBeInTheDocument()
    expect(screen.getByText('NODE_ENV=production')).toBeInTheDocument()
  })
})
