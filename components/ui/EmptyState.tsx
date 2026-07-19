"use client"

import { LucideIcon } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  title: string
  message: string
  icon: LucideIcon
  buttonText?: string
  buttonLink?: string
  buttonAction?: () => void
}

export default function EmptyState({
  title,
  message,
  icon: Icon,
  buttonText,
  buttonLink,
  buttonAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-800/30 rounded-xl border border-gray-700">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700/50 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-sm">{message}</p>
      {(buttonText && (buttonLink || buttonAction)) && (
        <div className="mt-4">
          {buttonLink ? (
            <Link
              href={buttonLink}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
            >
              {buttonText}
            </Link>
          ) : (
            <button
              onClick={buttonAction}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
            >
              {buttonText}
            </button>
          )}
        </div>
      )}
    </div>
  )
}