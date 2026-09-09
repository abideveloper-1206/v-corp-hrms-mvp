import { Drawer } from '@heroui/react'
import { SidebarNav } from './Sidebar'

export function MobileNavDrawer({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Backdrop>
        <Drawer.Content placement="left" className="w-72">
          <Drawer.Dialog className="h-full">
            <SidebarNav onNavigate={() => onOpenChange(false)} />
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
