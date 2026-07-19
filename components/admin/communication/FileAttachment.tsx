"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileText,
  FileImage,
  File,
  Loader2,
  Paperclip,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  mimeType: string;
}

interface FileAttachmentProps {
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export default function FileAttachment({
  onAttachmentsChange,
  maxFiles = 5,
  maxSize = 10,
  disabled = false,
  className = "",
}: FileAttachmentProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    if (attachments.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const file = files[0];
    if (!file) return;

    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File exceeds ${maxSize}MB limit`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/communication/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        const newAttachment = {
          id: `temp_${Date.now()}`,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          fileUrl: data.fileUrl,
          mimeType: data.mimeType || data.fileType,
        };

        const updated = [...attachments, newAttachment];
        setAttachments(updated);
        onAttachmentsChange(updated);
        toast.success(`Uploaded: ${data.fileName}`);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    const updated = attachments.filter((a) => a.id !== id);
    setAttachments(updated);
    onAttachmentsChange(updated);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-red-400" />;
    if (mimeType.includes("image")) return <FileImage className="h-5 w-5 text-blue-400" />;
    return <File className="h-5 w-5 text-gray-400" />;
  };

  const getFileColor = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "border-red-500/20 bg-red-500/5";
    if (mimeType.includes("image")) return "border-blue-500/20 bg-blue-500/5";
    return "border-white/10 bg-gray-800/30";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed p-6 text-center transition-all",
          dragOver
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-white/10 bg-gray-800/30 hover:border-indigo-500/30 hover:bg-indigo-500/5",
          disabled && "opacity-50 cursor-not-allowed",
          attachments.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && e.dataTransfer.files.length && attachments.length < maxFiles) {
            handleFileUpload(e.dataTransfer.files);
          }
        }}
      >
        <input
          type="file"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFileUpload(e.target.files);
            }
            e.target.value = "";
          }}
          disabled={disabled || uploading || attachments.length >= maxFiles}
          className="absolute inset-0 cursor-pointer opacity-0"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.docx,.zip,.txt"
        />

        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm font-medium text-white">Uploading...</p>
            </>
          ) : (
            <>
              <div className={cn(
                "rounded-full p-3 transition-all",
                dragOver ? "bg-indigo-500/30" : "bg-indigo-500/20"
              )}>
                {dragOver ? (
                  <Upload className="h-6 w-6 text-indigo-400 animate-bounce" />
                ) : (
                  <Paperclip className="h-6 w-6 text-indigo-400" />
                )}
              </div>
              <p className="text-sm font-medium text-white">
                {dragOver ? "Drop file here" : "Attach files"}
              </p>
              <p className="text-xs text-gray-500">
                Drag & drop or click to upload • Max {maxSize}MB
              </p>
              <p className="text-[10px] text-gray-600">
                PDF, PNG, JPG, WEBP, Excel, Word, ZIP, TXT
              </p>
              <p className="text-[10px] text-gray-600">
                {attachments.length} / {maxFiles} files used
              </p>
            </>
          )}
        </div>
      </div>

      {/* Attachment List */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <p className="text-xs font-medium text-gray-400">Attached Files</p>
            {attachments.map((attachment) => (
              <motion.div
                key={attachment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                  getFileColor(attachment.mimeType)
                )}
              >
                {getFileIcon(attachment.mimeType)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {attachment.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(attachment.fileSize)}</span>
                    <span>•</span>
                    <span>{attachment.mimeType.split("/")[1] || "File"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}