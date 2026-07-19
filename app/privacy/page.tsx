"use client"

import { Shield, Lock, Database, Mail, Eye, UserCheck, FileText, CheckCircle, ShieldCheck, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      items: [
        "Email address and account information",
        "Profile information (username, display name, bio)",
        "Match results and performance statistics",
        "Gameplay data and achievements",
        "Communication data (posts, comments, messages)",
        "Device and browser information"
      ]
    },
    {
      title: "How We Use Your Information",
      icon: UserCheck,
      items: [
        "To operate and improve the platform",
        "To facilitate matchmaking and tournaments",
        "To send match reminders and notifications",
        "To verify results and maintain fair play",
        "To personalize your experience",
        "To communicate important updates and announcements"
      ]
    },
    {
      title: "Data Protection",
      icon: Shield,
      items: [
        "All data is encrypted in transit and at rest",
        "Passwords are securely hashed and never stored in plain text",
        "Access to personal data is restricted to authorized personnel",
        "We never share your data with third parties without consent",
        "You can request data deletion at any time",
        "We regularly audit our security practices"
      ]
    },
    {
      title: "Your Rights",
      icon: ShieldCheck,
      items: [
        "Right to access your personal data",
        "Right to correct inaccurate data",
        "Right to request data deletion",
        "Right to withdraw consent at any time",
        "Right to data portability",
        "Right to object to data processing"
      ]
    },
    {
      title: "Cookies & Tracking",
      icon: Eye,
      items: [
        "We use essential cookies for authentication",
        "Session cookies to keep you logged in",
        "Analytics cookies to improve the platform",
        "Preference cookies to remember your settings",
        "You can manage cookie preferences in your browser",
        "Third-party cookies are limited to essential services"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
            <Lock className="h-4 w-4 text-indigo-400" />
            <span className="text-sm text-indigo-400">Privacy Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your Privacy <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Matters to Us
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            We are committed to protecting your personal data. This policy explains how we 
            collect, use, and safeguard your information when you use Nexus Esports.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Overview */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-full mb-2">
                <Shield className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-sm text-gray-300">Secure</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-full mb-2">
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-sm text-gray-300">Encrypted</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-500/10 rounded-full mb-2">
                <CheckCircle className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-sm text-gray-300">Transparent</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-yellow-500/10 rounded-full mb-2">
                <UserCheck className="h-5 w-5 text-yellow-400" />
              </div>
              <p className="text-sm text-gray-300">You Control</p>
            </div>
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-6 mb-12">
          {sections.map((section, i) => (
            <div 
              key={i}
              className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 hover:border-indigo-500/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <section.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              </div>
              <ul className="space-y-2.5">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-gray-300 text-sm leading-relaxed">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Your Rights Summary */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-5 w-5 text-green-400" />
            <h3 className="text-white font-semibold">Your Privacy Rights</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span>Access your personal data</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span>Request data correction</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span>Request data deletion</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span>Withdraw consent</span>
            </div>
          </div>
        </div>

        {/* Contact & Footer */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 text-center">
          <h3 className="text-white font-semibold mb-2">Questions About Privacy?</h3>
          <p className="text-gray-400 text-sm">
            If you have any questions about this Privacy Policy, please contact us.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <a
              href="mailto:nexusesportshub@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-all"
            >
              <Mail className="h-4 w-4" />
              Contact Us
            </a>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-all"
            >
              Back to Home
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            This policy is effective as of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}