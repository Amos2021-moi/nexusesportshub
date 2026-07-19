"use client"

import { Shield, Trophy, Users, Calendar, Award, AlertTriangle, CheckCircle, BookOpen, Target, Clock, Gamepad2, Crown } from "lucide-react"
import Link from "next/link"

export default function RulesPage() {
  const sections = [
    {
      title: "General Rules",
      icon: Shield,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      rules: [
        "All players must register with a valid email address",
        "Players must be enrolled in the school to participate",
        "One account per player - multiple accounts are strictly prohibited",
        "Players must maintain good sportsmanship at all times",
        "Any form of cheating or exploitation will result in immediate ban"
      ]
    },
    {
      title: "League Rules",
      icon: Trophy,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      rules: [
        "Matches must be played within the scheduled time window",
        "Results must be submitted within 24 hours of match completion",
        "Evidence (screenshots/videos) is required for result verification",
        "Players must use their registered eFootball accounts",
        "All league matches follow the Premier League scoring system (Win=3, Draw=1, Loss=0)"
      ]
    },
    {
      title: "Tournament Rules",
      icon: Crown,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      rules: [
        "Tournament brackets are generated randomly",
        "Players must be available for their scheduled matches",
        "Match results must be submitted within 1 hour of completion",
        "Tournament champions will be inducted into the Hall of Fame",
        "In case of disputes, admin decision is final"
      ]
    },
    {
      title: "Community Guidelines",
      icon: Users,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      rules: [
        "No harassment, bullying, or toxic behavior",
        "Keep discussions respectful and constructive",
        "No spamming or self-promotion in community feeds",
        "Report inappropriate content to moderators",
        "Help maintain a positive and inclusive environment"
      ]
    },
    {
      title: "Code of Conduct",
      icon: Shield,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      rules: [
        "Practice good sportsmanship - win with humility, lose with grace",
        "Respect all players, admins, and staff members",
        "Do not exploit bugs or glitches for unfair advantage",
        "Do not share account credentials with anyone",
        "Follow all platform rules and admin instructions"
      ]
    }
  ]

  const penalties = [
    { violation: "Unsportsmanlike conduct", penalty: "Warning → 1-week ban → Permanent ban" },
    { violation: "Cheating / Exploiting", penalty: "Permanent ban (zero tolerance)" },
    { violation: "No-show / Forfeit", penalty: "Loss counted, repeat offenders penalized" },
    { violation: "Falsifying results", penalty: "Points deduction + temporary ban" },
    { violation: "Harassment / Abuse", penalty: "Immediate ban (1 week → permanent)" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
            <BookOpen className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">Official Rules</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            League <br />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Rules & Regulations
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Fair play is the foundation of Nexus Esports. These rules ensure a competitive, 
            respectful, and enjoyable experience for all players.
          </p>
        </div>

        {/* Quick Summary */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Fair Play</p>
            </div>
            <div className="text-center">
              <Target className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Competitive Integrity</p>
            </div>
            <div className="text-center">
              <Clock className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Punctuality</p>
            </div>
            <div className="text-center">
              <Users className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">Community Respect</p>
            </div>
          </div>
        </div>

        {/* Rules Sections */}
        <div className="space-y-6 mb-12">
          {sections.map((section, i) => (
            <div 
              key={i}
              className={`${section.bg} border ${section.border} rounded-2xl p-6 hover:border-opacity-50 transition-all`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 ${section.bg} rounded-lg`}>
                  <section.icon className={`h-5 w-5 ${section.color}`} />
                </div>
                <h2 className={`text-xl font-semibold ${section.color}`}>{section.title}</h2>
              </div>
              <ul className="space-y-2.5">
                {section.rules.map((rule, j) => (
                  <li key={j} className="flex items-start gap-3 text-gray-300 text-sm leading-relaxed">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Penalties */}
        <h2 className="text-2xl font-bold text-white text-center mb-8">Penalties & Enforcement</h2>
        <div className="bg-gray-800/30 border border-red-500/20 rounded-2xl p-6 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-white font-semibold">Violations & Consequences</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 text-gray-400 font-medium">Violation</th>
                  <th className="text-left py-3 text-gray-400 font-medium">Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {penalties.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 text-gray-300">{item.violation}</td>
                    <td className="py-3 text-red-400">{item.penalty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * All penalties are at the discretion of the admin team. Repeated violations may result in permanent ban.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-blue-400 font-semibold mb-2">Questions About the Rules?</h3>
          <p className="text-gray-400 text-sm">
            Contact the admin team for clarifications or disputes.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link
              href="/support"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all"
            >
              Contact Support
            </Link>
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