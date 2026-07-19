// ✅ Simple logger for production
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`ℹ️ ${message}`, data || "")
  },
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data || "")
  },
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error || "")
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`🐛 ${message}`, data || "")
    }
  },
}

// ✅ API error handler
export function logApiError(endpoint: string, error: any) {
  logger.error(`API Error: ${endpoint}`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  })
}

// ✅ Database error handler
export function logDbError(operation: string, error: any) {
  logger.error(`DB Error: ${operation}`, {
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
  })
}