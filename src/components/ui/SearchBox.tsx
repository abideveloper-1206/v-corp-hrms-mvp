import { SearchField } from '@heroui/react'
import { cn } from '#/lib/utils'

export function SearchBox({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}) {
  return (
    <SearchField value={value} onChange={onChange} fullWidth aria-label={ariaLabel ?? placeholder} className={cn('w-full', className)}>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder={placeholder} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  )
}
