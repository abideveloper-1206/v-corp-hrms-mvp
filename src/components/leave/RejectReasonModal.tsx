import { useState } from 'react'
import { Button } from '@heroui/react'
import { FormModal } from '#/components/ui/FormModal'
import { TextAreaField } from '#/components/ui/FormFields'

export function RejectReasonModal({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (note: string) => void
  isLoading: boolean
}) {
  const [note, setNote] = useState('')

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) setNote('')
      }}
      title="Reject leave request"
      description="Let the employee know why this request is being rejected."
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onPress={() => onConfirm(note || 'Rejected.')} isDisabled={isLoading}>
            {isLoading ? 'Rejecting…' : 'Reject request'}
          </Button>
        </div>
      }
    >
      <TextAreaField
        label="Reason for rejection"
        placeholder="e.g. Insufficient coverage during this period"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </FormModal>
  )
}
