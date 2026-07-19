"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Trophy, 
  Users, 
  Zap, 
  Shield, 
  Calendar, 
  Award, 
  TrendingUp,
  MessageCircle,
  Crown,
  Target,
  Eye,
  Play,
  ChevronRight,
  Star,
  ArrowRight,
  Mail,
  Menu,
  X,
  Disc,
  Code2
} from "lucide-react"

export default function LandingTestPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [formStatus, setFormStatus] = useState("")

  // Features data
  const features = [
    { 
      name: "Live Match Tracking", 
      description: "Real-time scores, stats, and notifications for every match", 
      icon: Eye,
      color: "from-blue-500 to-cyan-400"
    },
    { 
      name: "Tournament Management", 
      description: "Create, manage, and compete in tournaments with ease", 
      icon: Trophy,
      color: "from-yellow-500 to-orange-400"
    },
    { 
      name: "Player Profiles", 
      description: "Detailed profiles with stats, achievements, and history", 
      icon: Users,
      color: "from-green-500 to-emerald-400"
    },
    { 
      name: "Community Feed", 
      description: "Connect, chat, and share with athletes worldwide", 
      icon: MessageCircle,
      color: "from-purple-500 to-pink-400"
    },
    { 
      name: "Performance Analytics", 
      description: "Advanced analytics to track and improve your game", 
      icon: TrendingUp,
      color: "from-indigo-500 to-purple-400"
    },
    { 
      name: "Trust Score System", 
      description: "Verified players with trust scores for fair competition", 
      icon: Shield,
      color: "from-cyan-500 to-blue-400"
    },
  ]

  // Sports categories
  const sports = [
    { name: "eFootball", icon: "⚽", color: "from-blue-500 to-blue-400", players: "1.2M" },
    { name: "FIFA", icon: "🎮", color: "from-purple-500 to-purple-400", players: "850K" },
    { name: "Rocket League", icon: "🚀", color: "from-orange-500 to-orange-400", players: "450K" },
    { name: "NBA 2K", icon: "🏀", color: "from-red-500 to-red-400", players: "320K" },
    { name: "Madden NFL", icon: "🏈", color: "from-green-500 to-green-400", players: "280K" },
    { name: "Call of Duty", icon: "🎯", color: "from-gray-500 to-gray-400", players: "1.1M" },
    { name: "Valorant", icon: "🎯", color: "from-red-500 to-red-400", players: "780K" },
    { name: "Fortnite", icon: "⭐", color: "from-yellow-500 to-yellow-400", players: "650K" },
  ]

  // Stats
  const stats = [
    { number: "2.4M+", label: "Athletes" },
    { number: "180+", label: "Countries" },
    { number: "99.9%", label: "Uptime" },
    { number: "50K+", label: "Daily Matches" },
  ]

  // Testimonials
  const testimonials = [
    {
      name: "Amos Mark",
      role: "Professional Player",
      quote: "Nexus Esports Hub transformed how I compete. The match tracking and community features are unmatched.",
      image: "A"
    },
    {
      name: "Sarah Wanjiru",
      role: "Team Captain",
      quote: "Managing my team has never been easier. From tournaments to player stats, everything is in one place.",
      image: "S"
    },
    {
      name: "James Ochieng",
      role: "Coach",
      quote: "The analytics and trust score system help me identify talent and build winning teams.",
      image: "J"
    },
  ]

  // Pricing plans
  const pricing = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for getting started",
      features: ["Basic match tracking", "Community access", "Player profile", "Limited tournaments"],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "$9.99",
      description: "For serious competitors",
      features: ["Advanced analytics", "Unlimited tournaments", "Priority support", "Custom branding"],
      cta: "Start Pro",
      popular: true
    },
    {
      name: "Elite",
      price: "$19.99",
      description: "For teams and organizations",
      features: ["Team management", "API access", "Dedicated support", "Custom features"],
      cta: "Contact Sales",
      popular: false
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setFormStatus("Please enter your email")
      return
    }
    setFormStatus("✅ You're on the list! Check your email.")
    setEmail("")
    setTimeout(() => setFormStatus(""), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span>Nexus<span className="text-indigo-400">Esports</span></span>
            </Link>

            {/* Desktop Nav */}
            <ul className="hidden md:flex items-center gap-8 text-sm text-gray-300">
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#sports" className="hover:text-white transition">Sports</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#testimonials" className="hover:text-white transition">Community</a></li>
              <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
            </ul>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/signin" className="text-sm text-gray-300 hover:text-white transition">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/25">
                Get Started →
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-950/95 backdrop-blur-xl border-b border-white/5 px-4 py-6 space-y-4">
            <ul className="space-y-3 text-gray-300">
              <li><a href="#features" className="block hover:text-white transition">Features</a></li>
              <li><a href="#sports" className="block hover:text-white transition">Sports</a></li>
              <li><a href="#pricing" className="block hover:text-white transition">Pricing</a></li>
              <li><a href="#testimonials" className="block hover:text-white transition">Community</a></li>
              <li><a href="#contact" className="block hover:text-white transition">Contact</a></li>
            </ul>
            <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
              <Link href="/auth/signin" className="text-center text-gray-300 hover:text-white transition py-2">
                Sign In
              </Link>
              <Link href="/auth/signup" className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl py-3 font-semibold hover:from-indigo-700 hover:to-purple-700 transition">
                Get Started →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Live now — 2,847 active matches worldwide
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Where Athletes
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Connect, Compete
                </span>
                <br />
                &amp; Conquer.
              </h1>
              <p className="text-xl text-gray-400 max-w-lg mb-8">
                The ultimate hub for sports communities. Track live scores, join tournaments,
                connect with athletes, and elevate your game — all from one powerful platform.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <Link href="/auth/signup" className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/25 flex items-center gap-2">
                  Join the Hub
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Watch Demo
                </button>
              </div>
              <div className="flex gap-8">
                <div>
                  <div className="text-2xl font-bold text-white">2.4M+</div>
                  <div className="text-sm text-gray-400">Athletes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">180+</div>
                  <div className="text-sm text-gray-400">Countries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-sm text-gray-400">Uptime</div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Main Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl relative">
                <div className="inline-flex items-center gap-2 text-sm text-green-400 mb-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Live Now
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-2xl font-bold text-blue-400 mx-auto mb-1">
                      FC
                    </div>
                    <div className="text-sm font-medium">Falcons</div>
                  </div>
                  <div className="text-2xl font-bold text-white">VS</div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center text-2xl font-bold text-purple-400 mx-auto mb-1">
                      NX
                    </div>
                    <div className="text-sm font-medium">Nexus</div>
                  </div>
                </div>
                <div className="text-center mb-2">
                  <div className="text-4xl font-bold text-white">3 — 2</div>
                  <div className="text-sm text-gray-400">78' — 2nd Half</div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400 border-t border-white/5 pt-4">
                  <span>Premier League</span>
                  <span>👥 24.5k watching</span>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-gray-800/80 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-lg flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Goal!</div>
                  <div className="text-xs text-gray-400">Falcons +2 pts</div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-gray-800/80 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-lg flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">1.2k chats</div>
                  <div className="text-xs text-gray-400">Active discussion</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="border-t border-white/5 border-b border-white/5 py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <p className="text-sm text-gray-400 text-center">Trusted by elite teams &amp; athletes worldwide</p>
        </div>
        <div className="flex animate-marquee whitespace-nowrap gap-12 text-sm text-gray-300">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-12">
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-400 rounded-full"></div>Apex FC</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-400 rounded-full"></div>Velocity United</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full"></div>Storm Athletics</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full"></div>Phoenix Rising</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-pink-400 rounded-full"></div>Titan Esports</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-400 rounded-full"></div>Quantum Sports</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm text-indigo-400 font-semibold uppercase tracking-wider">Core Features</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
              Everything you need to <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">dominate the game</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Powerful tools built for athletes, teams, coaches, and fans who demand excellence.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-gray-800/30 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition group">
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.name}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SPORTS ===== */}
      <section id="sports" className="py-20 px-4 bg-gray-800/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm text-purple-400 font-semibold uppercase tracking-wider">Sports We Cover</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
              One hub. <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Every sport.</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">From mainstream to niche — track, compete, and engage across all your favorite disciplines.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sports.map((sport, i) => (
              <div key={i} className={`bg-gradient-to-br ${sport.color} bg-opacity-10 border border-white/10 rounded-xl p-4 text-center hover:scale-105 transition`}>
                <div className="text-4xl mb-2">{sport.icon}</div>
                <div className="font-semibold text-white">{sport.name}</div>
                <div className="text-sm text-gray-400">{sport.players} players</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-20 px-4 bg-gray-800/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm text-green-400 font-semibold uppercase tracking-wider">Community Voices</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
              Loved by <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">athletes everywhere</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Real stories from the people who trust Nexus Esports Hub every day.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-800/30 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {t.image}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="text-sm text-gray-400">{t.role}</div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">"{t.quote}"</p>
                <div className="flex gap-1 mt-3 text-yellow-400">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm text-yellow-400 font-semibold uppercase tracking-wider">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
              Choose your <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">game plan</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Start free. Scale when you're ready. No hidden fees, cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <div key={i} className={`bg-gray-800/30 border ${plan.popular ? 'border-indigo-500/50' : 'border-white/5'} rounded-2xl p-6 relative`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className="text-lg font-semibold text-white">{plan.name}</div>
                  <div className="text-3xl font-bold text-white mt-2">{plan.price}</div>
                  <div className="text-sm text-gray-400 mt-1">{plan.description}</div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckIcon className="w-4 h-4 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold transition ${plan.popular ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">level up</span>?
              </h2>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                Join 2.4 million athletes who are already competing, connecting, and conquering with Nexus Esports Hub.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                  required
                />
                <button type="submit" className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
                  Join Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              {formStatus && (
                <p className={`mt-4 text-sm ${formStatus.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                  {formStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 text-xl font-bold mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span>Nexus<span className="text-indigo-400">Esports</span></span>
              </Link>
              <p className="text-sm text-gray-400 max-w-sm">
                The ultimate hub for athletes, teams, and fans. Connect, compete, and conquer — all in one place.
              </p>
              
            </div>
            <div>
              <h5 className="font-semibold text-white mb-4">Product</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#sports" className="hover:text-white transition">Sports</a></li>
                <li><a href="#" className="hover:text-white transition">Live Scores</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-4">Company</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Press</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-4">Resources</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 flex flex-col sm:flex-row justify-between text-sm text-gray-400">
            <span>© 2026 Nexus Esports Hub. All rights reserved.</span>
            <span>Privacy · Terms · Cookies</span>
          </div>
        </div>
      </footer>

      {/* Marquee Animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
          width: max-content;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

// Check icon component
function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}