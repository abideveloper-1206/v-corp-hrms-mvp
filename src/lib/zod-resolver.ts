import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'

/**
 * A minimal zod resolver implemented against our installed react-hook-form's own
 * types. @hookform/resolvers ships its own bundled RHF type definitions which can
 * drift from whatever RHF version is actually installed and produce false
 * "unrelated types" errors — this sidesteps that entirely.
 */
export function zodResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values)
    if (result.success) {
      return { values: result.data as T, errors: {} }
    }
    const errors: FieldErrors<T> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (path && !(path in errors)) {
        ;(errors as Record<string, { type: string; message: string }>)[path] = { type: issue.code, message: issue.message }
      }
    }
    return { values: {}, errors }
  }
}
