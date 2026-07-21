"use client";

import { memo } from "react";

/* -------------------------------------------------------------------------- */
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Skeleton Components                       */
/* -------------------------------------------------------------------------- */

// === Stat Skeleton ===
export const StatSkeleton = memo(function StatSkeleton() {
  const isMobile = useIsMobile();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 p-4 text-center backdrop-blur-sm">
      {/* Premium shimmer effect - desktop only */}
      {!isMobile && (
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      )}
      
      {/* Icon placeholder */}
      <div className="mx-auto h-5 w-5 rounded-lg bg-white/10 sm:h-6 sm:w-6" />
      
      {/* Number placeholder */}
      <div className="mt-2 h-7 w-16 mx-auto rounded bg-white/10 sm:h-8" />
      
      {/* Label placeholder */}
      <div className="mt-0.5 h-3 w-12 mx-auto rounded bg-white/5 sm:w-14" />
      
      {/* Decorative line */}
      <div className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4" />
    </div>
  );
});

StatSkeleton.displayName = "StatSkeleton";

// === Navbar Skeleton ===
export const NavbarSkeleton = memo(function NavbarSkeleton() {
  const isMobile = useIsMobile();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-gray-900/90 backdrop-blur-xl shadow-2xl shadow-black/20">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600" />
          <div className="h-5 w-32 rounded bg-white/10 sm:block hidden" />
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-16 rounded bg-white/5" />
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="h-10 w-20 rounded-xl bg-white/5" />
          <div className="h-10 w-24 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600" />
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden h-11 w-11 rounded-xl bg-white/5" />
      </nav>
    </header>
  );
});

NavbarSkeleton.displayName = "NavbarSkeleton";

// === Hero Skeleton ===
export const HeroSkeleton = memo(function HeroSkeleton() {
  return (
    <section className="relative px-4 pt-24 pb-12 sm:px-6 sm:pt-32 lg:px-8 lg:pt-40">
      <div className="mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-sm">
          <div className="h-3.5 w-3.5 rounded-full bg-emerald-400/50" />
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="h-3.5 w-3.5 rounded-full bg-yellow-400/50" />
        </div>

        {/* Title */}
        <div className="mt-6 h-12 w-3/4 mx-auto rounded bg-white/10 sm:h-14" />
        <div className="mt-2 h-12 w-1/2 mx-auto rounded bg-white/5 sm:h-14" />

        {/* Description */}
        <div className="mx-auto mt-5 max-w-2xl">
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="mt-2 h-4 w-5/6 mx-auto rounded bg-white/5" />
          <div className="mt-2 h-4 w-4/6 mx-auto rounded bg-white/5" />
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <div className="h-12 w-48 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600" />
          <div className="h-12 w-44 rounded-xl border border-white/15 bg-white/5" />
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-emerald-400/30" />
              <div className="h-3 w-16 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    </section>
  );
});

HeroSkeleton.displayName = "HeroSkeleton";

// === Feature Skeleton ===
export const FeatureSkeleton = memo(function FeatureSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-gray-800/40 p-5 backdrop-blur-sm">
      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500" />
      <div className="mt-3 h-5 w-3/4 rounded bg-white/10" />
      <div className="mt-1 space-y-2">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-white/5" />
      </div>
      <div className="mt-3 h-4 w-24 rounded bg-indigo-400/20" />
    </div>
  );
});

FeatureSkeleton.displayName = "FeatureSkeleton";

// === Step Skeleton ===
export const StepSkeleton = memo(function StepSkeleton() {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-gray-800/40 p-6 text-center backdrop-blur-sm">
      <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600" />
      <div className="mx-auto mt-3 h-6 w-8 rounded-full bg-indigo-400/30" />
      <div className="mt-2 h-5 w-32 mx-auto rounded bg-white/10" />
      <div className="mt-1 space-y-1.5">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-5/6 mx-auto rounded bg-white/5" />
      </div>
    </div>
  );
});

StepSkeleton.displayName = "StepSkeleton";

// === Team Member Skeleton ===
export const TeamSkeleton = memo(function TeamSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-5 text-center backdrop-blur-sm">
      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600" />
      <div className="mt-3 h-4 w-24 mx-auto rounded bg-white/10" />
      <div className="mt-1 h-3 w-20 mx-auto rounded bg-white/5" />
      <div className="mx-auto mt-2 h-4 w-4 rounded-full bg-indigo-400/20" />
    </div>
  );
});

TeamSkeleton.displayName = "TeamSkeleton";

// === Testimonial Skeleton ===
export const TestimonialSkeleton = memo(function TestimonialSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-gray-800/40 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-3.5 w-3.5 rounded bg-yellow-400/20" />
        ))}
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-white/5" />
        <div className="h-3 w-4/6 rounded bg-white/5" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
        <div>
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="mt-1 h-3 w-20 rounded bg-white/5" />
          <div className="mt-0.5 h-2 w-16 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
});

TestimonialSkeleton.displayName = "TestimonialSkeleton";

// === Partner Skeleton ===
export const PartnerSkeleton = memo(function PartnerSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2">
      <div className="h-5 w-5 rounded bg-white/10" />
      <div className="h-4 w-16 rounded bg-white/10" />
    </div>
  );
});

PartnerSkeleton.displayName = "PartnerSkeleton";
