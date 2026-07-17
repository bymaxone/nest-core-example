/**
 * @fileoverview Frozen registry mapping each demo failure kind to a function
 * that throws the matching exception. Covers every row of the library's
 * BYMAX_* error-code catalog: the standard `HttpException` derivations, the
 * unmapped-4xx and unmapped-5xx fallbacks, and the unknown-throw collapse, so
 * every derivation is reproducible on demand through `POST /failures/:kind`.
 * @layer constants
 */

import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotImplementedException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common'

/** Every demo failure kind, one per accepted `POST /failures/:kind` route param. */
export type FailureKind =
  | 'bad-request'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'payload-too-large'
  | 'unsupported-media-type'
  | 'unprocessable'
  | 'too-many-requests'
  | 'internal'
  | 'not-implemented'
  | 'bad-gateway'
  | 'service-unavailable'
  | 'gateway-timeout'
  | 'teapot'
  | 'variant-5xx'
  | 'unknown'

/**
 * Deterministic marker embedded in the unknown-throw's message, so a test can
 * assert it is absent from a production-mode response and present in a
 * development-mode one.
 */
export const UNKNOWN_FAILURE_MARKER = 'demo unknown failure: catalog-collapse-marker'

/**
 * Frozen map from failure kind to a trigger throwing the matching exception.
 * Every trigger is a pure throw: no side effects, no state, safe to call any
 * number of times.
 */
export const FAILURE_REGISTRY: Readonly<Record<FailureKind, () => never>> = Object.freeze({
  'bad-request': () => {
    throw new BadRequestException('Demo bad request failure')
  },
  unauthorized: () => {
    throw new UnauthorizedException('Demo unauthorized failure')
  },
  forbidden: () => {
    throw new ForbiddenException('Demo forbidden failure')
  },
  conflict: () => {
    throw new ConflictException('Demo conflict failure')
  },
  'payload-too-large': () => {
    throw new PayloadTooLargeException('Demo payload too large failure')
  },
  'unsupported-media-type': () => {
    throw new UnsupportedMediaTypeException('Demo unsupported media type failure')
  },
  unprocessable: () => {
    throw new UnprocessableEntityException('Demo unprocessable entity failure')
  },
  // @nestjs/common ships no dedicated TooManyRequestsException class; the
  // catalog still derives BYMAX_TOO_MANY_REQUESTS from the raw 429 status.
  'too-many-requests': () => {
    throw new HttpException('Demo too many requests failure', HttpStatus.TOO_MANY_REQUESTS)
  },
  internal: () => {
    throw new InternalServerErrorException('Demo internal server error failure')
  },
  'not-implemented': () => {
    throw new NotImplementedException('Demo not implemented failure')
  },
  'bad-gateway': () => {
    throw new BadGatewayException('Demo bad gateway failure')
  },
  'service-unavailable': () => {
    throw new ServiceUnavailableException('Demo service unavailable failure')
  },
  'gateway-timeout': () => {
    throw new GatewayTimeoutException('Demo gateway timeout failure')
  },
  // 418 has no dedicated catalog row: the filter derives the unmapped-4xx
  // fallback BYMAX_CLIENT_ERROR from the raw status.
  teapot: () => {
    throw new HttpException('I am a teapot', HttpStatus.I_AM_A_TEAPOT)
  },
  // 507 has no dedicated catalog row either: the filter derives the
  // unmapped-5xx fallback BYMAX_INTERNAL_ERROR from the raw status.
  'variant-5xx': () => {
    throw new HttpException('Insufficient storage', HttpStatus.INSUFFICIENT_STORAGE)
  },
  // A plain Error, not an HttpException: the filter collapses this to the
  // fixed, production-safe 500 envelope rather than deriving from a status.
  unknown: () => {
    throw new Error(UNKNOWN_FAILURE_MARKER)
  },
})

/**
 * Narrow an arbitrary string to a known {@link FailureKind}.
 *
 * @param kind - The raw route parameter to check.
 * @returns Whether `kind` is a registered failure kind.
 */
export function isFailureKind(kind: string): kind is FailureKind {
  return Object.hasOwn(FAILURE_REGISTRY, kind)
}
