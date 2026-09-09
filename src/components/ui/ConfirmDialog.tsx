import { Button, Spinner } from '@heroui/react'
import { AlertTriangle, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { FormModal } from '#/components/ui/FormModal'
import { cn } from '#/lib/utils'

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading = false,
  onConfirm,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  isLoading?: boolean
  onConfirm: () => void
}) {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onPress={onConfirm} isDisabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            tone === 'danger' ? 'bg-danger-soft text-danger-soft-foreground' : 'bg-accent-soft text-accent-soft-foreground',
          )}
        >
          {tone === 'danger' ? <AlertTriangle className="size-[18px]" /> : <Info className="size-[18px]" />}
        </span>
        <div className="pt-1.5 text-sm text-foreground">{description}</div>
      </div>
    </FormModal>
  )
}
