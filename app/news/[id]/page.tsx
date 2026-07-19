import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, User, ArrowLeft, Share2 } from "lucide-react"

interface NewsPageProps {
  params: Promise<{ id: string }>
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { id } = await params

  const news = await prisma.news.findUnique({
    where: {
      id,
      published: true,
    },
    include: {
      author: {
        include: {
          profile: true,
        },
      },
    },
  })

  if (!news) {
    notFound()
  }

  // Get related news
  const relatedNews = await prisma.news.findMany({
    where: {
      published: true,
      id: { not: id },
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </Link>

        {/* Article */}
        <article>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {news.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{news.author?.name || "Unknown Author"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(news.publishedAt || news.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                  Published
                </span>
              </div>
            </div>
          </div>

          {/* Image */}
          {news.image && (
            <div className="relative w-full h-64 md:h-96 mb-8 rounded-xl overflow-hidden">
              <Image
                src={news.image}
                alt={news.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {news.content}
            </p>
          </div>

          {/* Share */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={() => {
                navigator.share?.({
                  title: news.title,
                  text: news.content.slice(0, 100),
                  url: window.location.href,
                })
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-all"
            >
              <Share2 className="h-4 w-4" />
              Share this article
            </button>
          </div>
        </article>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6">Related News</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 hover:border-indigo-500/30 transition-all group"
                >
                  {item.image && (
                    <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-white font-semibold group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}