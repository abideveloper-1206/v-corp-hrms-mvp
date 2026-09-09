import { Toast } from '@heroui/react'

export function Toaster() {
  return (
    <Toast.Provider placement="top end">
      {({ toast: queuedToast }) => (
        <Toast toast={queuedToast} variant={queuedToast.content.variant}>
          <Toast.Content>
            {queuedToast.content.title ? <Toast.Title>{queuedToast.content.title}</Toast.Title> : null}
            {queuedToast.content.description ? <Toast.Description>{queuedToast.content.description}</Toast.Description> : null}
          </Toast.Content>
          <Toast.CloseButton />
        </Toast>
      )}
    </Toast.Provider>
  )
}

export { toast } from '@heroui/react'
