"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DashboardLogoutButtonProps {
  isExpanded?: boolean
}

export function DashboardLogoutButton({ isExpanded = true }: DashboardLogoutButtonProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-xs font-semibold h-9"
          >
            <LogOut className="h-4 w-4 shrink-0 text-slate-500 hover:text-red-600" />
            {isExpanded ? (
              <span className="whitespace-nowrap truncate">Log out</span>
            ) : null}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm sign out</DialogTitle>
          <DialogDescription>
            Are you sure you want to sign out of your TalentFlow HR session? This will end the current login and clear the session cookie.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogTrigger render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
