"use client"

import { Suspense } from "react"
import ResetPasswordForm from "./ResetPasswordForm"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="text-white/60">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}