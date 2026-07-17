/**
 * @fileoverview Declarative catalog of every trigger card on the Errors page.
 *
 * Covers all 16 `POST /failures/:kind` derivations plus the three
 * catalog-driven demonstrations (not-found, validation, and the custom
 * `CATALOG_OUT_OF_SEASON` domain code), spanning the full spec §7.3 catalog.
 *
 * @layer components/errors
 */

import type { ApiResult } from '@/lib/api-client'
import {
  NOT_FOUND_DEMO_PRODUCT_ID,
  SEASONAL_DEMO_PRODUCT_ID,
  getProduct,
  getSeasonalProduct,
  triggerCatalogValidationError,
} from '@/lib/catalog-api'
import { triggerFailure } from '@/lib/failures-api'

/** Visual grouping for the trigger grid. */
export type TriggerGroup = '4xx' | '5xx' | 'special'

/** One trigger card: what it demonstrates and how to fire it. */
export interface Trigger {
  /** Stable id, also used as the React key. */
  readonly id: string
  /** Card label. */
  readonly label: string
  /** The envelope `code` this trigger is expected to produce. */
  readonly expectedCode: string
  /** The HTTP status this trigger is expected to produce. */
  readonly statusCode: number
  /** Visual group. */
  readonly group: TriggerGroup
  /** Fires the request that should produce the expected envelope. */
  readonly run: () => Promise<ApiResult<unknown>>
  /** True for the one custom, non-`BYMAX_` domain code demo (`seasonal`). */
  readonly isDomainCode?: true
}

/** Every trigger card, in display order within its group. */
export const TRIGGERS: readonly Trigger[] = [
  // -- 4xx: client errors --------------------------------------------------
  {
    id: 'bad-request',
    label: 'Bad Request',
    expectedCode: 'BYMAX_BAD_REQUEST',
    statusCode: 400,
    group: '4xx',
    run: () => triggerFailure('bad-request'),
  },
  {
    id: 'unauthorized',
    label: 'Unauthorized',
    expectedCode: 'BYMAX_UNAUTHORIZED',
    statusCode: 401,
    group: '4xx',
    run: () => triggerFailure('unauthorized'),
  },
  {
    id: 'forbidden',
    label: 'Forbidden',
    expectedCode: 'BYMAX_FORBIDDEN',
    statusCode: 403,
    group: '4xx',
    run: () => triggerFailure('forbidden'),
  },
  {
    id: 'conflict',
    label: 'Conflict',
    expectedCode: 'BYMAX_CONFLICT',
    statusCode: 409,
    group: '4xx',
    run: () => triggerFailure('conflict'),
  },
  {
    id: 'payload-too-large',
    label: 'Payload Too Large',
    expectedCode: 'BYMAX_PAYLOAD_TOO_LARGE',
    statusCode: 413,
    group: '4xx',
    run: () => triggerFailure('payload-too-large'),
  },
  {
    id: 'unsupported-media-type',
    label: 'Unsupported Media Type',
    expectedCode: 'BYMAX_UNSUPPORTED_MEDIA_TYPE',
    statusCode: 415,
    group: '4xx',
    run: () => triggerFailure('unsupported-media-type'),
  },
  {
    id: 'unprocessable',
    label: 'Unprocessable Entity',
    expectedCode: 'BYMAX_UNPROCESSABLE_ENTITY',
    statusCode: 422,
    group: '4xx',
    run: () => triggerFailure('unprocessable'),
  },
  {
    id: 'too-many-requests',
    label: 'Too Many Requests',
    expectedCode: 'BYMAX_TOO_MANY_REQUESTS',
    statusCode: 429,
    group: '4xx',
    run: () => triggerFailure('too-many-requests'),
  },
  // -- 5xx: server errors ---------------------------------------------------
  {
    id: 'internal',
    label: 'Internal Server Error',
    expectedCode: 'BYMAX_INTERNAL_ERROR',
    statusCode: 500,
    group: '5xx',
    run: () => triggerFailure('internal'),
  },
  {
    id: 'not-implemented',
    label: 'Not Implemented',
    expectedCode: 'BYMAX_NOT_IMPLEMENTED',
    statusCode: 501,
    group: '5xx',
    run: () => triggerFailure('not-implemented'),
  },
  {
    id: 'bad-gateway',
    label: 'Bad Gateway',
    expectedCode: 'BYMAX_BAD_GATEWAY',
    statusCode: 502,
    group: '5xx',
    run: () => triggerFailure('bad-gateway'),
  },
  {
    id: 'service-unavailable',
    label: 'Service Unavailable',
    expectedCode: 'BYMAX_SERVICE_UNAVAILABLE',
    statusCode: 503,
    group: '5xx',
    run: () => triggerFailure('service-unavailable'),
  },
  {
    id: 'gateway-timeout',
    label: 'Gateway Timeout',
    expectedCode: 'BYMAX_GATEWAY_TIMEOUT',
    statusCode: 504,
    group: '5xx',
    run: () => triggerFailure('gateway-timeout'),
  },
  // -- special: fallbacks, collapse, and catalog-driven demos --------------
  {
    id: 'teapot',
    label: "I'm a Teapot",
    expectedCode: 'BYMAX_CLIENT_ERROR',
    statusCode: 418,
    group: 'special',
    run: () => triggerFailure('teapot'),
  },
  {
    id: 'variant-5xx',
    label: 'Insufficient Storage',
    expectedCode: 'BYMAX_INTERNAL_ERROR',
    statusCode: 507,
    group: 'special',
    run: () => triggerFailure('variant-5xx'),
  },
  {
    id: 'unknown',
    label: 'Unknown Throw',
    expectedCode: 'BYMAX_INTERNAL_ERROR',
    statusCode: 500,
    group: 'special',
    run: () => triggerFailure('unknown'),
  },
  {
    id: 'validation',
    label: 'Catalog Validation',
    expectedCode: 'BYMAX_VALIDATION_FAILED',
    statusCode: 400,
    group: 'special',
    run: () => triggerCatalogValidationError(),
  },
  {
    id: 'not-found',
    label: 'Catalog Not Found',
    expectedCode: 'BYMAX_NOT_FOUND',
    statusCode: 404,
    group: 'special',
    run: () => getProduct(NOT_FOUND_DEMO_PRODUCT_ID),
  },
  {
    id: 'seasonal',
    label: 'Seasonal (custom code)',
    expectedCode: 'CATALOG_OUT_OF_SEASON',
    statusCode: 409,
    group: 'special',
    run: () => getSeasonalProduct(SEASONAL_DEMO_PRODUCT_ID),
    isDomainCode: true,
  },
] as const
