/**
 * @fileoverview Annotated JSON viewer for an {@link ErrorEnvelope}.
 *
 * Renders each field as its own row with a hover tooltip explaining the
 * field per the documented contract (spec §7.2); the `correlationId` row is
 * highlighted when present. Shared by the Errors page's trigger grid and the
 * Pagination page's corrupt-cursor demo, since both render the same envelope
 * shape.
 *
 * @layer components/shared
 */

'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ErrorEnvelope } from '@/lib/envelope'

/** One field's display annotation, in the order rendered. */
interface FieldAnnotation {
  readonly key: keyof ErrorEnvelope
  readonly note: string
}

/** Every envelope field, in documented order, with its hover explanation. */
const FIELD_ANNOTATIONS: readonly FieldAnnotation[] = [
  { key: 'statusCode', note: 'HTTP status code of the response. Always present.' },
  {
    key: 'code',
    note: 'Stable machine-readable code: a BYMAX_* catalog code, or a passed-through domain code. Always present.',
  },
  { key: 'message', note: 'Human-readable message, safe to show end users. Always present.' },
  {
    key: 'details',
    note: 'Structured context, such as validation issues. Present only when it exists.',
  },
  {
    key: 'correlationId',
    note: 'Correlation id for the request. Present only when a provider resolves one.',
  },
  { key: 'timestamp', note: 'ISO 8601 instant the error was formatted. Always present.' },
  { key: 'path', note: 'Request URL path. Always present.' },
] as const

/**
 * Render one field's value: quoted for strings, indented JSON otherwise.
 *
 * `details` is the only structural field, and it carries the payloads a reader
 * most needs to inspect: an array of validation issues, or an unknown error's
 * message and stack. Compact JSON renders those as one unreadable line with
 * literal `\n` escapes, so objects and arrays are indented instead.
 *
 * @param value - The field's runtime value.
 * @returns The display string, possibly spanning several lines.
 */
function renderValue(value: unknown): string {
  if (typeof value === 'string') {
    return `"${value}"`
  }
  return typeof value === 'object' && value !== null
    ? JSON.stringify(value, null, 2)
    : JSON.stringify(value)
}

interface FieldRowProps {
  annotation: FieldAnnotation
  value: unknown
  isLast: boolean
}

/** One `"key": value` row with a hover tooltip and optional trailing comma. */
function FieldRow({ annotation, value, isLast }: FieldRowProps) {
  const isCorrelationId = annotation.key === 'correlationId'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'hover:bg-(--glass-bg-hover) -mx-1 flex gap-1 rounded px-1 pl-5',
            isCorrelationId && 'bg-(--color-primary-20)',
          )}
        >
          <span className="text-(--color-secondary)">&quot;{annotation.key}&quot;</span>
          <span className="text-(--text-40)">:</span>
          {/* whitespace-pre-wrap keeps the indented JSON's newlines; break-words
              (not break-all) wraps long values such as a stack frame's path at
              word boundaries instead of mid-token. */}
          <span className="text-(--text-80) whitespace-pre-wrap break-words">
            {renderValue(value)}
            {!isLast && ','}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">{annotation.note}</TooltipContent>
    </Tooltip>
  )
}

interface EnvelopeViewerProps {
  /** The envelope to render. */
  envelope: ErrorEnvelope
}

/**
 * Annotated, copyable JSON rendering of an error envelope.
 *
 * @param envelope - The envelope to render.
 */
export function EnvelopeViewer({ envelope }: EnvelopeViewerProps) {
  const [copied, setCopied] = useState(false)
  const presentFields = FIELD_ANNOTATIONS.filter((field) => envelope[field.key] !== undefined)

  const handleCopy = () => {
    void navigator.clipboard.writeText(JSON.stringify(envelope, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="border-(--glass-border) bg-(--glass-bg) rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Response envelope
        </span>
        <Button variant="ghost" size="sm" onClick={handleCopy} aria-label="Copy envelope JSON">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <TooltipProvider>
        <div className="font-mono text-sm">
          <div className="text-(--text-40)">{'{'}</div>
          {presentFields.map((field, index) => (
            <FieldRow
              key={field.key}
              annotation={field}
              value={envelope[field.key]}
              isLast={index === presentFields.length - 1}
            />
          ))}
          <div className="text-(--text-40)">{'}'}</div>
        </div>
      </TooltipProvider>
    </div>
  )
}
