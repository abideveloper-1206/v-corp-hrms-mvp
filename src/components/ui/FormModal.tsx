import { Drawer } from '@heroui/react'
import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

const SIZE_CLASSES: Record<string, string> = {
  sm: 'w-full sm:w-[420px]',
  md: 'w-full sm:w-[520px]',
  lg: 'w-full sm:w-[640px]',
  xl: 'w-full sm:w-[760px]',
}

export function FormModal({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog className={cn('flex bg-default h-full flex-col p-0', SIZE_CLASSES[size], 'max-w-full')}>
            <Drawer.Header className="flex shrink-0 items-start justify-between gap-3 border-b border-separator bg-surface px-5 py-4">
              <div className="min-w-0">
                <Drawer.Heading className="text-base font-semibold text-foreground">{title}</Drawer.Heading>
                {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
              </div>
              <Drawer.CloseTrigger />
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto px-5 py-5">{children}</Drawer.Body>
            {footer ? <Drawer.Footer className="shrink-0 border-t border-separator bg-surface px-5 py-4">{footer}</Drawer.Footer> : null}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
