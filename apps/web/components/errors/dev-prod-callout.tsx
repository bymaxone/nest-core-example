/**
 * @fileoverview Static, honest explanation of the dev-vs-prod difference on
 * the Unknown Throw trigger's envelope.
 *
 * @layer components/errors
 */

/**
 * Glass callout explaining `ENVELOPE_EXPOSE_INTERNALS` and the production
 * collapse, verified against the running API's actual behavior.
 */
export function DevProdCallout() {
  return (
    <div className="border-(--glass-border) bg-(--glass-bg) rounded-xl border p-4 text-sm text-(--text-70)">
      <strong className="text-foreground">Dev vs. prod:</strong> this example&apos;s development
      default is <code className="font-mono text-xs">ENVELOPE_EXPOSE_INTERNALS=true</code>, so the{' '}
      <em>Unknown Throw</em> card&apos;s envelope carries a <code>details</code> block with the
      original message and stack. Setting <code>NODE_ENV=production</code> collapses that same
      trigger to the fixed, safe message with no <code>details</code> at all: internals never leak
      to a production client regardless of the flag.
    </div>
  )
}
