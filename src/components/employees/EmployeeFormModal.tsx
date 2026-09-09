import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '#/lib/zod-resolver'
import { z } from 'zod'
import { Button } from '@heroui/react'
import type { Department, Employee } from '#/types'
import { FormModal } from '#/components/ui/FormModal'
import { ControlledTextField, DatePickerField, FieldGroup, SelectField } from '#/components/ui/FormFields'
import { useCreateEmployee, useUpdateEmployee } from '#/hooks/useEmployees'
import { toast } from '#/components/ui/Toaster'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  departmentId: z.string().min(1, 'Select a department'),
  designation: z.string().min(1, 'Designation is required'),
  managerId: z.string().nullable(),
  joiningDate: z.string().min(1, 'Joining date is required'),
  employmentStatus: z.enum(['active', 'inactive', 'on-leave']),
  location: z.string().min(1, 'Location is required'),
  baseSalary: z.coerce.number().min(1, 'Enter a valid salary'),
  address: z.string().min(1, 'Address is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
})

type FormValues = z.infer<typeof schema>

const STATUS_OPTIONS = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'on-leave', label: 'On Leave' },
]

const GENDER_OPTIONS = [
  { id: 'Male', label: 'Male' },
  { id: 'Female', label: 'Female' },
  { id: 'Other', label: 'Other' },
]

function emptyDefaults(): FormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designation: '',
    managerId: null,
    joiningDate: new Date().toISOString().slice(0, 10),
    employmentStatus: 'active',
    location: '',
    baseSalary: 60000,
    address: '',
    dateOfBirth: '',
    gender: 'Other',
    emergencyContactName: '',
    emergencyContactPhone: '',
  }
}

function employeeToDefaults(employee: Employee): FormValues {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    departmentId: employee.departmentId,
    designation: employee.designation,
    managerId: employee.managerId,
    joiningDate: employee.joiningDate.slice(0, 10),
    employmentStatus: employee.employmentStatus,
    location: employee.location,
    baseSalary: employee.baseSalary,
    address: employee.address,
    dateOfBirth: employee.dateOfBirth.slice(0, 10),
    gender: employee.gender,
    emergencyContactName: employee.emergencyContactName,
    emergencyContactPhone: employee.emergencyContactPhone,
  }
}

export function EmployeeFormModal({
  isOpen,
  onOpenChange,
  employee,
  departments,
  employees,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
  departments: Array<Department>
  employees: Array<Employee>
}) {
  const isEditing = Boolean(employee)
  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: employee ? employeeToDefaults(employee) : emptyDefaults() })

  useEffect(() => {
    if (isOpen) reset(employee ? employeeToDefaults(employee) : emptyDefaults())
  }, [isOpen, employee, reset])

  const departmentOptions = useMemo(() => departments.map((d) => ({ id: d.id, label: d.name })), [departments])
  const managerOptions = useMemo(
    () => [
      { id: '', label: 'No manager' },
      ...employees.filter((e) => e.id !== employee?.id).map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName}` })),
    ],
    [employees, employee],
  )

  async function onSubmit(values: FormValues) {
    const payload = { ...values, managerId: values.managerId || null }
    try {
      if (isEditing && employee) {
        await updateMutation.mutateAsync({ id: employee.id, input: payload })
        toast.success('Employee updated', { description: `${values.firstName} ${values.lastName}'s details were saved.` })
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Employee added', { description: `${values.firstName} ${values.lastName} was added to V Corp.` })
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
      title={isEditing ? 'Edit employee' : 'Add employee'}
      description={isEditing ? 'Update this employee’s profile information.' : 'Enter details to add a new employee to V Corp.'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onPress={() => handleSubmit(onSubmit)()} isDisabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add employee'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Personal information</p>
          <FieldGroup>
            <ControlledTextField control={control} name="firstName" label="First name" errorMessage={errors.firstName?.message} />
            <ControlledTextField control={control} name="lastName" label="Last name" errorMessage={errors.lastName?.message} />
            <ControlledTextField control={control} name="email" type="email" label="Email" errorMessage={errors.email?.message} />
            <ControlledTextField control={control} name="phone" label="Phone" errorMessage={errors.phone?.message} />
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field }) => (
                <DatePickerField label="Date of birth" value={field.value} onChange={field.onChange} errorMessage={errors.dateOfBirth?.message} />
              )}
            />
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <SelectField label="Gender" items={GENDER_OPTIONS} selectedKey={field.value} onSelectionChange={(k) => field.onChange(k)} />
              )}
            />
          </FieldGroup>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Employment details</p>
          <FieldGroup>
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <SelectField
                  label="Department"
                  isRequired
                  items={departmentOptions}
                  selectedKey={field.value || null}
                  onSelectionChange={(k) => field.onChange(k)}
                  errorMessage={errors.departmentId?.message}
                />
              )}
            />
            <ControlledTextField control={control} name="designation" label="Designation" errorMessage={errors.designation?.message} />
            <Controller
              control={control}
              name="managerId"
              render={({ field }) => (
                <SelectField
                  label="Reporting manager"
                  items={managerOptions}
                  selectedKey={field.value || ''}
                  onSelectionChange={(k) => field.onChange(k || null)}
                  placeholder="No manager"
                />
              )}
            />
            <Controller
              control={control}
              name="joiningDate"
              render={({ field }) => (
                <DatePickerField label="Joining date" value={field.value} onChange={field.onChange} errorMessage={errors.joiningDate?.message} />
              )}
            />
            <Controller
              control={control}
              name="employmentStatus"
              render={({ field }) => (
                <SelectField label="Employment status" isRequired items={STATUS_OPTIONS} selectedKey={field.value} onSelectionChange={(k) => field.onChange(k)} />
              )}
            />
            <ControlledTextField control={control} name="location" label="Location" placeholder="City, Country" errorMessage={errors.location?.message} />
            <ControlledTextField
              control={control}
              name="baseSalary"
              label="Base salary (monthly, INR)"
              type="number"
              min={0}
              errorMessage={errors.baseSalary?.message}
            />
          </FieldGroup>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Contact & emergency</p>
          <FieldGroup>
            <ControlledTextField control={control} name="address" label="Address" className="sm:col-span-2" errorMessage={errors.address?.message} />
            <ControlledTextField control={control} name="emergencyContactName" label="Emergency contact name" errorMessage={errors.emergencyContactName?.message} />
            <ControlledTextField control={control} name="emergencyContactPhone" label="Emergency contact phone" errorMessage={errors.emergencyContactPhone?.message} />
          </FieldGroup>
        </div>
      </form>
    </FormModal>
  )
}
