"use client"

import { FileText, Shield, Users, CheckCircle, AlertTriangle, Scale, Gavel, Clock, Zap, Lock, Mail } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      icon: FileText,
      content: "By using Nexus Esports, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. These terms apply to all users, including players, admins, and visitors."
    },
    {
      title: "User Accounts",
      icon: Users,
      content: "You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information when registering. You are solely responsible for all activities that occur under your account."
    },
    {
      title: "User Conduct",
      icon: Shield,
      content: "You agree to use the platform responsibly and respectfully. This includes: not engaging in harassment or bullying, not cheating or exploiting, not posting inappropriate content, and respecting other players and admins. Violations may result in account suspension or termination."
    },
    {
      title: "Fair Play",
      icon: Scale,
      content: "All players are expected to compete fairly. Cheating, collusion, match-fixing, or any form of unfair advantage is strictly prohibited. Results must be submitted honestly. The admin team reserves the right to investigate and take action against any suspected violations."
    },
    {
      title: "Intellectual Property",
      icon: Zap,
      content: "All content on Nexus Esports, including logos, trademarks, and platform design, is the property of Nexus Esports. You may not copy, reproduce, or distribute any content without permission. User-generated content remains the property of the user but is licensed to the platform for operation."
    },
    {
      title: "Dispute Resolution",
      icon: Gavel,
      content: "All disputes will be handled by the admin team. The admin decision is final and binding. In case of serious disputes, the matter may be escalated to the platform's governing body. Users agree to resolve disputes through the platform's official channels."
    }
  ]

  const prohibitedActions = [
    "Cheating or exploiting bugs",
    "Harassing or bullying other players",
    "Sharing account credentials",
    "Posting inappropriate content",
    "Impersonating other users",
    "Spamming or self-promotion",
    "Violating fair play rules",
    "Attempting to circumvent security measures"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
            <Scale className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-400">Terms of Service</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Service
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            By using Nexus Esports, you agree to these terms. Please read them carefully 
            before creating an account or using our services.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Summary */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-full mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-sm text-gray-300">Agree to Terms</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-full mb-2">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-sm text-gray-300">Fair Play</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-yellow-500/10 rounded-full mb-2">
                <Gavel className="h-5 w-5 text-yellow-400" />
              </div>
              <p className="text-sm text-gray-300">Admin Authority</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-red-500/10 rounded-full mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <p className="text-sm text-gray-300">Zero Tolerance</p>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6 mb-12">
          {sections.map((section, i) => (
            <div 
              key={i}
              className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 hover:border-purple-500/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <section.icon className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Prohibited Actions */}
        <h2 className="text-2xl font-bold text-white text-center mb-8">Prohibited Actions</h2>
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-white font-semibold">What You Cannot Do</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {prohibitedActions.map((action, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                <span className="text-red-400">✕</span>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Consequences */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-yellow-400" />
            <h3 className="text-white font-semibold">Consequences of Violation</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 text-gray-300">
              <span className="text-yellow-400">1.</span>
              <span><span className="text-white font-medium">Warning:</span> First-time minor violations result in a warning.</span>
            </div>
            <div className="flex items-start gap-3 text-gray-300">
              <span className="text-yellow-400">2.</span>
              <span><span className="text-white font-medium">Temporary Suspension:</span> Repeated violations may result in account suspension.</span>
            </div>
            <div className="flex items-start gap-3 text-gray-300">
              <span className="text-yellow-400">3.</span>
              <span><span className="text-white font-medium">Permanent Ban:</span> Serious or repeated violations will result in permanent ban.</span>
            </div>
            <div className="flex items-start gap-3 text-gray-300">
              <span className="text-yellow-400">4.</span>
              <span><span className="text-white font-medium">Legal Action:</span> Severe violations may result in legal action.</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 text-center">
          <h3 className="text-white font-semibold mb-2">Questions About the Terms?</h3>
          <p className="text-gray-400 text-sm">
            If you have any questions about these Terms of Service, please contact us.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <a
              href="mailto:nexusesportshub@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all"
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
        </div>
      </div>
    </div>
  )
}