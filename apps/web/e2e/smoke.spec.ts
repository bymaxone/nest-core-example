/**
 * @fileoverview Web dashboard smoke (Playwright, running stack).
 *
 * Drives the real app against a live API: the public landing page at `/` and
 * the six dashboard pages under `/dashboard`. Each page must render its
 * heading and have its key scenario operable, not just statically rendered:
 * walking the landing CTA into the dashboard, firing a failure trigger,
 * firing a delayed request, walking an offset page, flipping a health
 * toggle, and reading the raw Prometheus scrape. Only structural facts
 * (headings, labels, envelope field names) are asserted; live values
 * (timestamps, durations, counters) are never pinned since they differ every
 * run.
 *
 * Every assertion is scoped to the `<main>` landmark: the sidebar renders on
 * every page with the exact same page-title text as each page's own
 * `CardTitle` (both "Errors", both "Latency", ...), so an unscoped locator
 * is ambiguous (Playwright strict mode) between the nav link and the page
 * content. `CardTitle` itself renders a plain `<div>`, not a heading
 * element, so page titles are matched by text, not by `getByRole('heading')`.
 *
 * @module e2e/smoke.spec
 */
import { test, expect } from '@playwright/test'

test.describe('dashboard smoke (running stack)', () => {
  test('Landing page renders and its CTA opens the dashboard', async ({ page }) => {
    /*
     * Scenario: a visitor arrives at the public entry point and clicks through.
     * Rule it protects: `/` serves the landing page (not a 404 left behind by
     * the move of the dashboard under `/dashboard`) and its primary CTA
     * actually reaches the Overview, so the only path a first-time visitor
     * has into the app is never silently broken.
     */
    await page.goto('/')
    const main = page.locator('main')

    await expect(main.getByRole('heading', { name: 'nest-core-example' })).toBeVisible()
    await expect(main.getByText('Feature coverage', { exact: true })).toBeVisible()

    // The CTA appears twice (hero and closing section); either one must work.
    await main.getByRole('link', { name: 'Open the dashboard' }).first().click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.locator('main').getByText('Overview', { exact: true })).toBeVisible()
  })

  test('Overview renders the status strip and every quick link', async ({ page }) => {
    /*
     * Scenario: a user opens the dashboard Overview at `/dashboard`.
     * Rule it protects: the shell renders the page title and every
     * quick-link card to the five feature pages, so navigation onward from
     * the Overview is never silently broken.
     */
    await page.goto('/dashboard')
    const main = page.locator('main')

    await expect(main.getByText('Overview', { exact: true })).toBeVisible()
    for (const label of ['Errors', 'Latency', 'Pagination', 'Health', 'Metrics']) {
      await expect(main.getByRole('link', { name: new RegExp(label) })).toBeVisible()
    }
  })

  test('Errors triggers a failure and renders the pinned envelope', async ({ page }) => {
    /*
     * Scenario: a user triggers the "Bad request" demo failure.
     * Rule it protects: the trigger grid actually calls the API and the
     * response panel renders the real BYMAX_BAD_REQUEST envelope, proving
     * the full round trip (button -> API -> envelope render), not a stub.
     */
    await page.goto('/dashboard/errors')
    const main = page.locator('main')
    await expect(main.getByText('Errors', { exact: true })).toBeVisible()

    await main.getByRole('button', { name: /Bad Request/i }).click()

    // The trigger card's own badge also reads "BYMAX_BAD_REQUEST"; scope to
    // the response panel's quoted rendering so this asserts the fired
    // envelope, not the static card label.
    const responsePanel = main.getByText('Response: Bad Request').locator('..')
    await expect(responsePanel.getByText('"BYMAX_BAD_REQUEST"')).toBeVisible()
    await expect(responsePanel.getByText('"statusCode"')).toBeVisible()
  })

  test('Latency fires a delayed request and records a sample', async ({ page }) => {
    /*
     * Scenario: a user fires the artificial-delay endpoint from the Latency Lab.
     * Rule it protects: the fire button drives a real request through the
     * timing interceptor and the sample feed picks up the new row, proving
     * the delay control, the API, and the polling feed are wired together.
     */
    await page.goto('/dashboard/latency')
    const main = page.locator('main')
    await expect(main.getByText('Latency', { exact: true })).toBeVisible()

    await main.getByRole('button', { name: 'Fire request' }).click()

    await expect(page.getByText(/Fired \d+ms/)).toBeVisible()
  })

  test('Pagination walks the offset table', async ({ page }) => {
    /*
     * Scenario: a user opens the Pagination page's default Offset tab.
     * Rule it protects: the offset table renders real seeded catalog rows
     * from `GET /catalog/products`, proving the offset pagination round
     * trip, not an empty or stubbed table.
     */
    await page.goto('/dashboard/pagination')
    const main = page.locator('main')
    await expect(main.getByText('Pagination', { exact: true })).toBeVisible()

    await expect(main.getByText('p-000001')).toBeVisible()
  })

  test('Health flips the flaky indicator and readiness reacts', async ({ page }) => {
    /*
     * Scenario: a user arms the flaky indicator to "down" from the Health Console.
     * Rule it protects: the toggle drives a real POST /health-demo/flaky call and
     * the aggregate readiness status flips to reflect it live, proving the
     * console is reading real state, not a static mock. Restored to "up"
     * afterward so this test never leaks state into another run.
     */
    await page.goto('/dashboard/health')
    const main = page.locator('main')
    await expect(main.getByText('Health', { exact: true })).toBeVisible()

    await main.getByRole('button', { name: 'Down' }).click()
    // The Readiness tile's status chip renders the uppercased status ("ERROR").
    await expect(main.getByText('ERROR').first()).toBeVisible()

    // Cleanup: restore the shared demo indicator to its default "up" state.
    await main.getByRole('button', { name: 'Up' }).click()
  })

  test('Metrics reads the raw Prometheus scrape', async ({ page }) => {
    /*
     * Scenario: a user opens the Metrics page.
     * Rule it protects: the raw scrape panel renders real Prometheus text
     * fetched from `GET /metrics`, including the default HTTP counter, so a
     * broken scrape fetch or a metrics-disabled misconfiguration is caught
     * immediately rather than only in production.
     */
    await page.goto('/dashboard/metrics')
    const main = page.locator('main')
    await expect(main.getByText('Metrics', { exact: true })).toBeVisible()

    await expect(main.getByText('http_requests_total').first()).toBeVisible()
  })
})
