"use client"

import { signOut } from "next-auth/react"

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

export function DashboardLogoutButton() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="ml-auto">Log out</Button>} />
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
