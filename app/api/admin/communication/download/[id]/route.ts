import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// For Next.js App Router, params is now a Promise
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the params Promise
    const params = await context.params;
    const attachmentId = params.id;

    // Get the attachment
    const attachment = await prisma.communicationAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        log: {
          include: {
            receipts: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Check if user has access
    const isAdmin = session.user?.role === "ADMIN";
    const isRecipient = attachment.log.receipts.length > 0;

    if (!isAdmin && !isRecipient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the file from Vercel Blob with authentication
    const response = await fetch(attachment.fileUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.mimeType || attachment.fileType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}