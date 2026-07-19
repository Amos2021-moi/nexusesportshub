"use client"

import { useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import imageCompression from "browser-image-compression"

interface ImageUploadProps {
  onUpload: (url: string) => void
  type: "profile" | "banner"
  currentImage?: string
}

export default function ImageUpload({ onUpload, type, currentImage }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage)
  const [error, setError] = useState<string>("")

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setUploading(true)

    try {
      // ✅ Check if imageCompression is available
      let imageData: string

      try {
        // Try to compress image
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: type === "profile" ? 300 : 1200,
          useWebWorker: true,
        }
        
        const compressedFile = await imageCompression(file, options)
        
        // Convert to base64
        imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result as string)
            } else {
              reject(new Error("Failed to read file"))
            }
          }
          reader.onerror = () => reject(new Error("File read error"))
          reader.readAsDataURL(compressedFile)
        })
      } catch (compressionError) {
        console.warn("Compression failed, using original file:", compressionError)
        // If compression fails, use the original file
        imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result as string)
            } else {
              reject(new Error("Failed to read file"))
            }
          }
          reader.onerror = () => reject(new Error("File read error"))
          reader.readAsDataURL(file)
        })
      }

      // Upload to server
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: imageData,
          type: type,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPreview(data.url)
        onUpload(data.url)
        setError("")
      } else {
        setError(data.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError(error instanceof Error ? error.message : "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative">
      <label className="cursor-pointer">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className={`${
                type === "profile"
                  ? "h-32 w-32 rounded-full object-cover border-4 border-white shadow"
                  : "h-48 w-full rounded-lg object-cover"
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 rounded-full">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              ) : (
                <Upload className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors ${
              type === "profile"
                ? "h-32 w-32 rounded-full"
                : "h-48 w-full rounded-lg"
            }`}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="mt-2 text-xs text-gray-500">
                  {type === "profile" ? "Upload Photo" : "Upload Banner"}
                </span>
              </>
            )}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}