"use client"

import { motion } from "framer-motion"

interface Match {
  id: string
  status: string
}

interface BracketConnectorProps {
  fromMatch?: Match
  toMatch?: Match
  direction: "right" | "left" | "down"
  isAnimated?: boolean
}

export default function BracketConnector({ 
  fromMatch, 
  toMatch, 
  direction = "right",
  isAnimated = true 
}: BracketConnectorProps) {
  const isCompleted = fromMatch?.status === "COMPLETED"
  const isPending = fromMatch?.status === "PENDING"
  
  // Determine line color based on match status
  const lineColor = isCompleted ? "bg-green-500/50" :
                    isPending ? "bg-yellow-500/50" :
                    "bg-gray-600/50"

  // Determine glow effect
  const glowEffect = isCompleted ? "shadow-[0_0_10px_rgba(34,197,94,0.3)]" : ""

  if (direction === "right" || direction === "left") {
    const isLeft = direction === "left"
    return (
      <div className="relative flex items-center justify-center w-full py-1">
        <div className={`relative w-full h-0.5 ${lineColor} ${glowEffect}`}>
          {isAnimated && isCompleted && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 bg-green-400"
            />
          )}
          {/* Arrow indicator */}
          <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'}`}>
            <div className={`w-0 h-0 border-t-4 border-b-4 ${isLeft ? 'border-r-4 border-l-0' : 'border-l-4 border-r-0'} border-transparent ${isLeft ? 'border-r-gray-600' : 'border-l-gray-600'}`} />
          </div>
        </div>
      </div>
    )
  }

  // Vertical connector
  return (
    <div className="relative flex justify-center py-1">
      <div className={`w-0.5 h-8 ${lineColor} ${glowEffect}`}>
        {isAnimated && isCompleted && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 bg-green-400"
          />
        )}
      </div>
    </div>
  )
}