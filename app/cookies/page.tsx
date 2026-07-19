"use client"

import { Cookie, Shield, Settings, Eye, CheckCircle, AlertCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function CookiesPage() {
  const cookieTypes = [
    {
      name: "Essential Cookies",
      icon: Shield,
      description: "These cookies are necessary for the platform to function properly. They enable core functionality like authentication, session management, and security.",
      examples: ["Authentication tokens", "Session IDs", "CSRF protection"],
      required: true
    },
    {
      name: "Preference Cookies",
      icon: Settings,
      description: "These cookies remember your preferences and settings to enhance your experience.",
      examples: ["Theme preference (dark/light)", "Language settings", "Layout preferences"],
      required: false
    },
    {
      name: "Analytics Cookies",
      icon: Eye,
      description: "These cookies help us understand how you interact with the platform, allowing us to improve performance and user experience.",
      examples: ["Page views", "Feature usage", "User behavior"],
      required: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
            <Cookie className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">Cookie Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Cookie <br />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            We use cookies to enhance your experience on Nexus Esports. This policy 
            explains what cookies we use, why we use them, and how you can control them.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* What Are Cookies */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Cookie className="h-5 w-5 text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">What Are Cookies?</h2>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            Cookies are small text files that are stored on your device when you visit a website. 
            They help the platform remember your preferences, keep you logged in, and improve 
            your overall experience. Cookies are safe and cannot access your personal files or 
            install malware.
          </p>
        </div>

        {/* Cookie Types */}
        <h2 className="text-2xl font-bold text-white text-center mb-8">How We Use Cookies</h2>
        <div className="space-y-4 mb-12">
          {cookieTypes.map((type, i) => (
            <div 
              key={i}
              className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 hover:border-yellow-500/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <type.icon className="h-5 w-5 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{type.name}</h3>
                {type.required && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                    Required
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">{type.description}</p>
              <div className="flex flex-wrap gap-2">
                {type.examples.map((example, j) => (
                  <span key={j} className="px-2 py-1 bg-gray-700/50 rounded-lg text-xs text-gray-400">
                    {example}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cookie Management */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-blue-400" />
            <h3 className="text-white font-semibold">Managing Your Cookie Preferences</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Browser Settings:</span>
                <span className="text-gray-400"> You can block or delete cookies through your browser settings. Each browser has different settings for cookie management.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Essential Cookies:</span>
                <span className="text-gray-400"> You cannot disable essential cookies as they are required for the platform to function.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Non-Essential Cookies:</span>
                <span className="text-gray-400"> You can opt out of non-essential cookies by adjusting your browser settings or using our cookie consent tool.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Third-Party Cookies */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <h3 className="text-white font-semibold">Third-Party Cookies</h3>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            We may use third-party services that set their own cookies. These include:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <span>•</span>
              <span><span className="text-white font-medium">Google Analytics:</span> For understanding platform usage and improving user experience.</span>
            </li>
            <li className="flex items-center gap-2">
              <span>•</span>
              <span><span className="text-white font-medium">Vercel:</span> For deployment and performance monitoring.</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 text-center">
          <h3 className="text-white font-semibold mb-2">Questions About Cookies?</h3>
          <p className="text-gray-400 text-sm">
            If you have any questions about our use of cookies, please contact us.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <a
              href="mailto:nexusesportshub@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-all"
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
            By continuing to use Nexus Esports, you consent to our use of cookies.
          </p>
        </div>
      </div>
    </div>
  )
}