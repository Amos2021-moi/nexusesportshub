import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { emailService } from "@/lib/services/email.service";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, html, text, template, data } = body;

    if (template) {
      const result = await emailService.sendTemplateEmail(
        to,
        template,
        data || {},
        subject
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: "Email sent successfully",
          messageId: result.messageId,
        });
      } else {
        return NextResponse.json(
          { error: result.error || "Failed to send email" },
          { status: 500 }
        );
      }
    }

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
