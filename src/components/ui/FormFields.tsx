import { Calendar, DateField, DatePicker, Description, FieldError, Input, Label, Select, TextArea, TextField, ListBox } from '@heroui/react'
import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { CalendarDate, parseDate } from '@internationalized/date'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { cn } from '#/lib/utils'

interface BaseFieldProps {
  label: string
  description?: string
  errorMessage?: string
  isRequired?: boolean
  className?: string
  hideLabel?: boolean
}

export const TextInputField = forwardRef<HTMLInputElement, BaseFieldProps & React.ComponentProps<'input'> & { type?: string }>(
  function TextInputField({ label, description, errorMessage, isRequired, className, type = 'text', ...rest }, ref) {
    return (
      <TextField isRequired={isRequired} isInvalid={Boolean(errorMessage)} className={cn('flex flex-col gap-1.5', className)}>
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <Input ref={ref} type={type} fullWidth {...rest} />
        {description && !errorMessage ? <Description className="text-xs text-muted">{description}</Description> : null}
        {errorMessage ? <FieldError className="text-xs text-danger">{errorMessage}</FieldError> : <FieldError />}
      </TextField>
    )
  },
)

export const TextAreaField = forwardRef<HTMLTextAreaElement, BaseFieldProps & React.ComponentProps<'textarea'>>(
  function TextAreaField({ label, description, errorMessage, isRequired, className, ...rest }, ref) {
    return (
      <TextField isRequired={isRequired} isInvalid={Boolean(errorMessage)} className={cn('flex flex-col gap-1.5', className)}>
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <TextArea ref={ref} fullWidth rows={3} {...rest} />
        {description && !errorMessage ? <Description className="text-xs text-muted">{description}</Description> : null}
        {errorMessage ? <FieldError className="text-xs text-danger">{errorMessage}</FieldError> : null}
      </TextField>
    )
  },
)

export interface SelectOption {
  id: string
  label: string
  description?: string
}

interface SelectFieldProps extends BaseFieldProps {
  items: Array<SelectOption>
  selectedKey: string | null
  onSelectionChange: (key: string | null) => void
  placeholder?: string
  isDisabled?: boolean
}

export function SelectField({
  label,
  description,
  errorMessage,
  isRequired,
  className,
  items,
  selectedKey,
  onSelectionChange,
  placeholder = 'Select an option',
  isDisabled,
  hideLabel,
}: SelectFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label className={cn('text-sm font-medium text-foreground', hideLabel && 'sr-only')}>
        {label}
        {isRequired ? <span className="text-danger"> *</span> : null}
      </Label>
      <Select
        placeholder={placeholder}
        value={selectedKey}
        onChange={(key) => onSelectionChange((key as string | null) ?? null)}
        isInvalid={Boolean(errorMessage)}
        isDisabled={isDisabled}
        fullWidth
        aria-label={label}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator>
            <ChevronDown className="size-4" />
          </Select.Indicator>
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {items.map((item) => (
              <ListBox.Item key={item.id} id={item.id} textValue={item.label}>
                {item.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      {description && !errorMessage ? <p className="text-xs text-muted">{description}</p> : null}
      {errorMessage ? <p className="text-xs text-danger">{errorMessage}</p> : null}
    </div>
  )
}

// Controlled (value/onChange) variants for use inside react-hook-form forms that call
// `reset()` to repopulate values dynamically (e.g. edit forms). Uncontrolled `register()`
// bindings don't reliably reflect `reset()` updates through HeroUI's Input wrapper layers,
// so these route through `Controller` instead — the same pattern already used for
// Select/DatePicker fields, which do update correctly.
interface ControlledTextFieldProps<T extends FieldValues>
  extends Omit<BaseFieldProps, 'className'>,
    Omit<React.ComponentProps<'input'>, 'name' | 'value' | 'onChange' | 'onBlur' | 'defaultValue'> {
  control: Control<T>
  name: Path<T>
  className?: string
}

export function ControlledTextField<T extends FieldValues>({ control, name, errorMessage, ...rest }: ControlledTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextInputField
          {...rest}
          errorMessage={errorMessage ?? fieldState.error?.message}
          name={field.name}
          value={(field.value as string | number | undefined) ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    />
  )
}

interface ControlledTextAreaFieldProps<T extends FieldValues>
  extends Omit<BaseFieldProps, 'className'>,
    Omit<React.ComponentProps<'textarea'>, 'name' | 'value' | 'onChange' | 'onBlur' | 'defaultValue'> {
  control: Control<T>
  name: Path<T>
  className?: string
}

export function ControlledTextAreaField<T extends FieldValues>({ control, name, errorMessage, ...rest }: ControlledTextAreaFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextAreaField
          {...rest}
          errorMessage={errorMessage ?? fieldState.error?.message}
          name={field.name}
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    />
  )
}

export function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>{children}</div>
}

interface DatePickerFieldProps extends BaseFieldProps {
  /** ISO calendar date string, e.g. "2026-09-08", or "" when empty. */
  value: string
  onChange: (value: string) => void
}

function parseValue(value: string): CalendarDate | null {
  if (!value) return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

export function DatePickerField({ label, description, errorMessage, isRequired, className, hideLabel, value, onChange }: DatePickerFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <DatePicker
        value={parseValue(value)}
        onChange={(date) => onChange(date ? date.toString() : '')}
        isInvalid={Boolean(errorMessage)}
        aria-label={label}
      >
        <Label className={cn('text-sm font-medium text-foreground', hideLabel && 'sr-only')}>
          {label}
          {isRequired ? <span className="text-danger"> *</span> : null}
        </Label>
        <DateField.Group fullWidth>
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix>
            <DatePicker.Trigger>
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DatePicker.Popover>
          <Calendar aria-label={label}>
            <Calendar.Header>
              <Calendar.YearPickerTrigger>
                <Calendar.YearPickerTriggerHeading />
                <Calendar.YearPickerTriggerIndicator />
              </Calendar.YearPickerTrigger>
              <Calendar.NavButton slot="previous" />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
              <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
            </Calendar.Grid>
            <Calendar.YearPickerGrid>
              <Calendar.YearPickerGridBody>{({ year }) => <Calendar.YearPickerCell year={year} />}</Calendar.YearPickerGridBody>
            </Calendar.YearPickerGrid>
          </Calendar>
        </DatePicker.Popover>
      </DatePicker>
      {description && !errorMessage ? <p className="text-xs text-muted">{description}</p> : null}
      {errorMessage ? <p className="text-xs text-danger">{errorMessage}</p> : null}
    </div>
  )
}
