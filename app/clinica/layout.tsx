"use client"

import { AuthGuard } from "@/components/auth-guard"
import { AppSidebar } from "@/components/app-sidebar"
import { UsageBanner } from "@/components/clinic/usage-banner"

export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="clinic_user">
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-6">
            <UsageBanner />
            <div className="mt-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}