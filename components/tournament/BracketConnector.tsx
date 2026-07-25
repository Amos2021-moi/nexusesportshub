"use client";

import { memo, useEffect, useState } from "react";

interface Match {
  id: string;
  status: string;
}

interface BracketConnectorProps {
  fromMatch?: Match;
  toMatch?: Match;
  direction: "right" | "left" | "down";
  isAnimated?: boolean;
}

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
/*                           STATIC Arrow Indicator                          */
/* -------------------------------------------------------------------------- */

const ArrowIndicator = memo(({ direction }: { direction: "right" | "left" }) => {
  const isLeft = direction === "left";
  
  return (
    <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'}`}>
      <div className={`w-0 h-0 border-t-4 border-b-4 ${isLeft ? 'border-r-4 border-l-0' : 'border-l-4 border-r-0'} border-transparent ${isLeft ? 'border-r-gray-600' : 'border-l-gray-600'}`} />
    </div>
  );
});

ArrowIndicator.displayName = "ArrowIndicator";

/* -------------------------------------------------------------------------- */
/*                           STATIC Connector                                */
/* -------------------------------------------------------------------------- */

const HorizontalConnector = memo(({ 
  isCompleted, 
  isPending, 
  direction 
}: { 
  isCompleted: boolean; 
  isPending: boolean; 
  direction: "right" | "left";
}) => {
  const lineColor = isCompleted ? "bg-green-500/50" :
                    isPending ? "bg-yellow-500/50" :
                    "bg-gray-600/50";
  const glowEffect = isCompleted ? "shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "";

  return (
    <div className="relative flex items-center justify-center w-full py-1">
      <div className={`relative w-full h-0.5 ${lineColor} ${glowEffect}`}>
        <ArrowIndicator direction={direction} />
      </div>
    </div>
  );
});

HorizontalConnector.displayName = "HorizontalConnector";

const VerticalConnector = memo(({ 
  isCompleted, 
  isPending 
}: { 
  isCompleted: boolean; 
  isPending: boolean; 
}) => {
  const lineColor = isCompleted ? "bg-green-500/50" :
                    isPending ? "bg-yellow-500/50" :
                    "bg-gray-600/50";
  const glowEffect = isCompleted ? "shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "";

  return (
    <div className="relative flex justify-center py-1">
      <div className={`w-0.5 h-8 ${lineColor} ${glowEffect}`} />
    </div>
  );
});

VerticalConnector.displayName = "VerticalConnector";

/* -------------------------------------------------------------------------- */
/*                           Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function BracketConnector({ 
  fromMatch, 
  toMatch, 
  direction = "right",
  isAnimated = true 
}: BracketConnectorProps) {
  const isMobile = useIsMobile();
  
  // ✅ On mobile, force isAnimated to false for performance
  const shouldAnimate = !isMobile && isAnimated;
  
  const isCompleted = fromMatch?.status === "COMPLETED";
  const isPending = fromMatch?.status === "PENDING";

  // ✅ No animations - static rendering only
  if (direction === "right" || direction === "left") {
    return <HorizontalConnector isCompleted={isCompleted} isPending={isPending} direction={direction} />;
  }

  // ✅ Vertical connector - no animations
  return <VerticalConnector isCompleted={isCompleted} isPending={isPending} />;
}