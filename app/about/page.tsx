"use client"

import { Trophy, Users, Award, Shield, Zap, Target, Sparkles, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const stats = [
    { label: "Active Players", value: "1,200+", icon: Users },
    { label: "Tournaments", value: "50+", icon: Trophy },
    { label: "Countries", value: "180+", icon: Shield },
    { label: "Matches Played", value: "10K+", icon: Target },
  ]

  const values = [
    {
      title: "Excellence",
      description: "We strive for excellence in everything we do, from competition to community.",
      icon: Trophy,
    },
    {
      title: "Community",
      description: "Building a strong, inclusive community where every player matters.",
      icon: Users,
    },
    {
      title: "Innovation",
      description: "Constantly evolving our platform to deliver the best esports experience.",
      icon: Zap,
    },
    {
      title: "Fair Play",
      description: "Ensuring fair competition with transparent rules and trust-based systems.",
      icon: Shield,
    },
  ]

  const team = [
    {
      name: "Amos Mark",
      role: "Founder & Lead Developer",
      bio: "Passionate about esports and building community-driven platforms.",
      avatar: "A",
    },
    {
      name: "Sarah Wanjiru",
      role: "Community Manager",
      bio: "Dedicated to fostering a positive and engaging community experience.",
      avatar: "S",
    },
    {
      name: "James Ochieng",
      role: "Esports Operations",
      bio: "Ensuring smooth tournament operations and league management.",
      avatar: "J",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-sm text-indigo-400">About Us</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            The Future of <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              School Esports
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Nexus Esports is the premier platform for school eFootball competitions. 
            We're building the next generation of esports athletes through fair play, 
            community, and competition.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, i) => (
            <div key={i} className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-500/10 rounded-lg mb-3">
                <stat.icon className="h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission Section */}
        <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-8 md:p-12 mb-16">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">Our Mission</h2>
              <p className="text-gray-300 leading-relaxed">
                To create the most inclusive and competitive school esports platform where 
                every player can showcase their skills, connect with others, and grow 
                both as a player and as a person.
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Fair Competition</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Community Driven</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Growth & Development</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <h2 className="text-2xl font-bold text-white text-center mb-8">Our Values</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {values.map((value, i) => (
            <div key={i} className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <value.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{value.title}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        <h2 className="text-2xl font-bold text-white text-center mb-8">Meet the Team</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {team.map((member, i) => (
            <div key={i} className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 text-center hover:border-indigo-500/30 transition-all">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                {member.avatar}
              </div>
              <h3 className="text-white font-semibold">{member.name}</h3>
              <p className="text-sm text-indigo-400">{member.role}</p>
              <p className="text-sm text-gray-400 mt-2">{member.bio}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Join the Community</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Ready to start your esports journey? Join thousands of players competing 
            in the premier school eFootball league.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            Get Started Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}