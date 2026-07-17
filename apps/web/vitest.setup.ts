/**
 * @fileoverview Vitest global setup: extends `expect` with jest-dom matchers
 * and polyfills the DOM APIs jsdom does not implement but Radix UI's
 * interactive primitives (Select, Tooltip) call unconditionally.
 *
 * Imported via `vitest.config.ts#test.setupFiles`. Runs once before each test
 * file so DOM assertions like `toBeInTheDocument()` are available everywhere.
 *
 * @module vitest.setup
 */

import '@testing-library/jest-dom'

// jsdom implements neither layout nor pointer capture; Radix Select and
// Tooltip call these unconditionally when opening/positioning their
// portal-rendered content, which otherwise throws "not a function".
if (typeof Element !== 'undefined') {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
}
