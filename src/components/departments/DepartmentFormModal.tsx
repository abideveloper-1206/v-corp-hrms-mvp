import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@heroui/react'
import { zodResolver } from '#/lib/zod-resolver'
import type { Department, Employee } from '#/types'
import { FormModal } from '#/components/ui/FormModal'
import { ControlledTextAreaField, ControlledTextField, SelectField } from '#/components/ui/FormFields'
import { useCreateDepartment, useUpdateDepartment } from '#/hooks/useDepartments'
import { toast } from '#/components/ui/Toaster'
import { cn } from '#/lib/utils'

const PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']

const schema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().min(1, 'Add a short description'),
  headEmployeeId: z.string().nullable(),
  color: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export function DepartmentFormModal({
  isOpen,
  onOpenChange,
  department,
  employees,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  department?: Department | null
  employees: Array<Employee>
}) {
  const isEditing = Boolean(department)
  const createMutation = useCreateDepartment()
  const updateMutation = useUpdateDepartment()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const defaults = useMemo<FormValues>(
    () => ({
      name: department?.name ?? '',
      description: department?.description ?? '',
      headEmployeeId: department?.headEmployeeId ?? null,
      color: department?.color ?? PALETTE[0],
    }),
    [department],
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults })

  useEffect(() => {
    if (isOpen) reset(defaults)
  }, [isOpen, defaults, reset])

  const headOptions = useMemo(() => {
    const deptEmployees = department ? employees.filter((e) => e.departmentId === department.id) : employees
    return [{ id: '', label: 'Unassigned' }, ...deptEmployees.map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName}` }))]
  }, [employees, department])

  async function onSubmit(values: FormValues) {
    const payload = { ...values, headEmployeeId: values.headEmployeeId || null }
    try {
      if (isEditing && department) {
        await updateMutation.mutateAsync({ id: department.id, input: payload })
        toast.success('Department updated', { description: `${values.name} was saved.` })
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Department created', { description: `${values.name} was added to V Corp.` })
      }
      onOpenChange(false)
    } catch {
      toast.danger('Something went wrong. Please try again.')
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit department' : 'Add department'}
      description={isEditing ? 'Update this department’s details.' : 'Create a new department for V Corp.'}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onPress={() => handleSubmit(onSubmit)()} isDisabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add department'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <ControlledTextField control={control} name="name" label="Department name" errorMessage={errors.name?.message} />
        <ControlledTextAreaField control={control} name="description" label="Description" errorMessage={errors.description?.message} />
        <Controller
          control={control}
          name="headEmployeeId"
          render={({ field }) => (
            <SelectField label="Head of department" items={headOptions} selectedKey={field.value || ''} onSelectionChange={(k) => field.onChange(k || null)} />
          )}
        />
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">Color</p>
              <div className="flex flex-wrap gap-2.5">
                {PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => field.onChange(hex)}
                    aria-label={`Choose color ${hex}`}
                    className={cn(
                      'size-8 rounded-full ring-offset-2 ring-offset-surface transition',
                      field.value === hex ? 'ring-2 ring-foreground' : 'hover:scale-105',
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          )}
        />
      </form>
    </FormModal>
  )
}
