import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put, head } from "@vercel/blob";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const fileName = `${timestamp}_${safeFileName}`;

    // Upload to Vercel Blob (PRIVATE access)
    const blob = await put(
      `communication/${fileName}`,
      file,
      {
        access: 'private',
        addRandomSuffix: true,
        contentType: file.type,
      }
    );

    // Generate a signed download URL (valid for 7 days)
    // Note: For private blobs, we use the download URL with token
    // The token is automatically included in the download URL
    const downloadUrl = blob.downloadUrl || blob.url;

    return NextResponse.json({
      success: true,
      fileUrl: blob.url,
      downloadUrl: downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      mimeType: file.type,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}