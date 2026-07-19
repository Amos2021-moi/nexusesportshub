import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { emailService } from "@/lib/services/email.service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test SMTP connection
    const testResult = await emailService.testConnection();

    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        message: "Email service is not configured properly",
        error: testResult.message,
      });
    }

    // Send test email
    const testEmailResult = await emailService.sendNotification(
      session.user.email,
      "🧪 Test Email",
      "This is a test email from Nexus Esports. Your email system is working correctly!",
      "HIGH",
      {
        link: process.env.NEXTAUTH_URL,
        customMessage: "If you received this, your email configuration is working perfectly!",
      }
    );

    return NextResponse.json({
      success: true,
      message: "Email service is working!",
      connection: testResult.message,
      testEmail: testEmailResult.success ? "Sent" : "Failed",
      testEmailId: testEmailResult.messageId || null,
      from: process.env.EMAIL_FROM || "nexusesportshub@gmail.com",
    });

  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Email test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}