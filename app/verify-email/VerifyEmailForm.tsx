"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token provided")
      return
    }

    fetch(`/api/user/email/verify/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus("success")
          setMessage(data.message)
          setTimeout(() => router.push("/dashboard/settings/account"), 3000)
        } else {
          setStatus("error")
          setMessage(data.error || "Verification failed")
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage("Something went wrong")
      })
  }, [token, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-white/20">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
            <p className="text-gray-300 mt-2 text-sm">Please wait</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Email Verified! ✅</h2>
            <p className="text-gray-300 mt-2">{message}</p>
            <p className="text-gray-400 text-sm mt-2">Redirecting to settings...</p>
            <button
              onClick={() => router.push("/dashboard/settings/account")}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
            >
              Go to Settings Now
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Verification Failed</h2>
            <p className="text-gray-300 mt-2">{message}</p>
            <button
              onClick={() => router.push("/dashboard/settings/account")}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
            >
              Go to Settings
            </button>
          </>
        )}
      </div>
    </div>
  )
}