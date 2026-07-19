"use client"

import { useState } from "react"
import { 
  HelpCircle, Mail, MessageCircle, BookOpen, 
  Shield, Trophy, Users, Calendar, Award, 
  ChevronDown, ChevronUp, Send, CheckCircle,
  AlertTriangle, Clock, Sparkles, ArrowRight
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "Click the 'Get Started' button on the homepage or go to /auth/signup. Fill in your details, verify your email, and you're ready to start competing!"
    },
    {
      question: "How do I join a tournament?",
      answer: "Go to the Tournaments page, find an active tournament, and click 'Join'. You'll be added to the bracket and notified when matches are scheduled."
    },
    {
      question: "How do I submit match results?",
      answer: "Go to your Fixtures page, find the match, click 'Submit Result', enter the scores, and upload evidence (screenshot/video). The admin will review and approve it."
    },
    {
      question: "What happens if I don't show up for a match?",
      answer: "Missing a scheduled match results in a forfeit loss. Repeated no-shows may lead to penalties or suspension from the league."
    },
    {
      question: "How are points calculated?",
      answer: "Points are calculated using the standard Premier League system: Win = 3 points, Draw = 1 point, Loss = 0 points. Standings are sorted by points, then goal difference, then goals scored."
    },
    {
      question: "How do I become an admin?",
      answer: "Admin access is granted by the platform owner. If you're interested in becoming an admin, contact us via the email below with your qualifications."
    },
    {
      question: "How do I verify my email?",
      answer: "After signing up, you'll receive a verification email. Click the link in the email to verify your account. You can also request a new verification link from your account settings."
    },
    {
      question: "What is the Hall of Fame?",
      answer: "The Hall of Fame honors the best players - tournament champions, league winners, and record holders. Players are inducted automatically when they win championships."
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !subject || !message) {
      toast.error("Please fill in all fields")
      return
    }

    setSending(true)
    try {
      // Simulate sending
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSent(true)
      toast.success("Message sent! We'll get back to you soon.")
      setEmail("")
      setSubject("")
      setMessage("")
    } catch (error) {
      toast.error("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
            <HelpCircle className="h-4 w-4 text-indigo-400" />
            <span className="text-sm text-indigo-400">Support Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How Can We <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Help You?
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Find answers to common questions or reach out to our support team. 
            We're here to help you make the most of your Nexus Esports experience.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "FAQ", icon: BookOpen, href: "#faq", color: "text-blue-400" },
            { label: "Rules", icon: Shield, href: "/rules", color: "text-yellow-400" },
            { label: "Contact", icon: Mail, href: "#contact", color: "text-green-400" },
            { label: "Community", icon: MessageCircle, href: "/community", color: "text-purple-400" },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 text-center hover:border-indigo-500/30 transition-all group"
            >
              <item.icon className={`h-6 w-6 ${item.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* FAQ Section */}
        <h2 id="faq" className="text-2xl font-bold text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3 mb-16">
          {faqs.map((faq, i) => (
            <div 
              key={i}
              className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden hover:border-indigo-500/20 transition-all"
            >
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-white font-medium">{faq.question}</span>
                {openFaq === i ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-gray-400 text-sm leading-relaxed border-t border-gray-700 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div id="contact" className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 md:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-6 w-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Contact Support</h2>
          </div>

          {sent ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-lg">Message Sent! ✅</h3>
              <p className="text-gray-400 text-sm mt-2">
                We've received your message and will get back to you within 24 hours.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-all"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's your question about?"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Describe your issue in detail..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-all resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    Send Message
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Direct Contact */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-6 text-center">
          <h3 className="text-white font-semibold mb-2">Prefer to email us directly?</h3>
          <a 
            href="mailto:nexusesportshub@gmail.com"
            className="text-indigo-400 hover:text-indigo-300 transition-colors text-lg font-medium"
          >
            nexusesportshub@gmail.com
          </a>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
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