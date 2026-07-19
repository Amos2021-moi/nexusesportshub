// app/news/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, ArrowLeft, Clock, ShieldCheck, Tag, Newspaper, ChevronRight } from "lucide-react";
import { ShareButton } from "./ShareButton";

interface NewsPageProps {
  params: Promise<{ id: string }>;
}

function estimateReadTime(content: string): number {
  if (!content) return 2;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function detectCategory(content: string): string {
  if (!content) return "General League Dispatch";
  const lower = content.toLowerCase();
  if (lower.includes("tournament") || lower.includes("championship") || lower.includes("bracket")) {
    return "Official Tournament Bulletin";
  }
  if (lower.includes("match") || lower.includes("score") || lower.includes("victory") || lower.includes("draw")) {
    return "Tactical Match Report";
  }
  if (lower.includes("update") || lower.includes("season") || lower.includes("announcement")) {
    return "Season Announcement";
  }
  return "Nexus Community Spotlight";
}

function getInitials(name: string): string {
  if (!name) return "NE";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { id } = await params;

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
  });

  if (!news) {
    notFound();
  }

  // Get related news
  const relatedNews = await prisma.news.findMany({
    where: {
      published: true,
      id: { not: id },
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  const authorDisplayName = news.author?.name || "Nexus Editorial Team";
  const authorUsername = news.author?.profile?.username;
  const readTime = estimateReadTime(news.content);
  const categoryBadge = detectCategory(news.content);
  const displayDate = news.publishedAt || news.createdAt;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 pb-24 pt-8 text-gray-100 selection:bg-indigo-500 selection:text-white sm:pt-12">
      {/* Background Radial Glow & Grid Architecture */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/80" />
        <div className="absolute -left-40 top-1/4 h-[550px] w-[550px] rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="absolute -right-40 top-1/2 h-[550px] w-[550px] rounded-full bg-purple-600/15 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ===================================================================== */}
        {/* 1. Back Navigation & Breadcrumbs                                      */}
        {/* ===================================================================== */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/news"
            className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-gray-300 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            <span>Back to News Center</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 sm:text-sm">
            <Link href="/" className="hover:text-indigo-400 transition-colors">
              Nexus
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-600" />
            <Link href="/news" className="hover:text-indigo-400 transition-colors">
              News
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-600" />
            <span className="text-gray-300 truncate max-w-[150px] sm:max-w-[220px]">
              {news.title}
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. Main Article Header & Author Meta Banner                           */}
        {/* ===================================================================== */}
        <article className="relative">
          <header className="mb-8 sm:mb-10">
            {/* Category Pill */}
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 shadow-sm backdrop-blur-md">
                <Tag className="h-3 w-3 text-indigo-400" />
                {categoryBadge}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300 backdrop-blur-md">
                <Clock className="h-3 w-3 text-gray-400" />
                {readTime} min reading time
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 shadow-sm">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Verified Dispatch
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl lg:leading-tight">
              {news.title}
            </h1>

            {/* Author & Publication Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-white/[0.06] to-white/[0.02] p-4 shadow-lg backdrop-blur-xl sm:p-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 font-bold text-white shadow-md ring-2 ring-white/20 sm:h-12 sm:w-12 sm:text-lg">
                  {getInitials(authorDisplayName)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-white sm:text-base">
                      {authorDisplayName}
                    </p>
                    {authorUsername && (
                      <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-indigo-300">
                        @{authorUsername}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Official Nexus Correspondent</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-gray-300 sm:text-sm">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <time dateTime={new Date(displayDate).toISOString()}>
                  {new Date(displayDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </div>
            </div>
          </header>

          {/* ===================================================================== */}
          {/* 3. Article Featured Image                                             */}
          {/* ===================================================================== */}
          {news.image && (
            <div className="relative mb-10 h-72 w-full overflow-hidden rounded-2xl border border-white/[0.12] shadow-[0_16px_48px_rgba(0,0,0,0.5)] sm:h-96 lg:h-[450px]">
              <Image
                src={news.image}
                alt={news.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />
            </div>
          )}

          {/* ===================================================================== */}
          {/* 4. Article Prose / Body Content                                       */}
          {/* ===================================================================== */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
            
            <div className="prose prose-invert max-w-none">
              <p className="text-base font-normal leading-relaxed text-gray-200 sm:text-lg lg:text-xl lg:leading-9 whitespace-pre-wrap">
                {news.content}
              </p>
            </div>

            {/* Interactive Share Button Client Component */}
            <ShareButton title={news.title} content={news.content} />
          </div>
        </article>

        {/* ===================================================================== */}
        {/* 5. Related News Grid                                                  */}
        {/* ===================================================================== */}
        {relatedNews.length > 0 && (
          <section className="mt-16 pt-10 border-t border-white/[0.08] sm:mt-20">
            <div className="mb-6 flex items-center justify-between sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                    Related News &amp; Dispatches
                  </h2>
                  <p className="text-xs text-gray-400 sm:text-sm">
                    More publications from our competitive season coverage
                  </p>
                </div>
              </div>

              <Link
                href="/news"
                className="group inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-white/[0.05] px-4 py-2 text-xs font-bold text-indigo-300 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                <span>All Articles</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 sm:gap-7 items-stretch">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-500/40 hover:bg-white/[0.08] sm:p-5"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div>
                    {item.image ? (
                      <div className="relative mb-4 h-36 w-full overflow-hidden rounded-xl border border-white/10 sm:h-40">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent" />
                      </div>
                    ) : (
                      <div className="relative mb-4 flex h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-900/30 to-purple-900/20 sm:h-40">
                        <Newspaper className="h-10 w-10 text-indigo-400/40 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                    )}

                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="h-3 w-3 text-indigo-400" />
                      <span>
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-base font-bold text-white transition-colors duration-200 group-hover:text-indigo-300">
                      {item.title}
                    </h3>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs font-semibold text-indigo-400">
                    <span>Read Dispatch</span>
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
