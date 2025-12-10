import { supabase } from '@/lib/db'
import { headers } from 'next/headers'

export interface LogData {
  type: 'user_login' | 'admin_action' | 'api_request' | 'error' | 'security' | 'performance'
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  userId?: string
  adminId?: string
  action: string
  description?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  endpoint?: string
  method?: string
  statusCode?: number
  responseTime?: number
  error?: string
  stackTrace?: string
}

export class Logger {
  static async log(data: LogData): Promise<void> {
    try {
      // Log seviyesi kontrolü - sadece error seviyesindeki logları kaydet
      const logLevel = process.env.LOG_LEVEL || 'info'
      const shouldLog = logLevel === 'debug' || 
                      (logLevel === 'info' && data.level !== 'debug') ||
                      (logLevel === 'warn' && ['warn', 'error', 'fatal'].includes(data.level || 'info')) ||
                      (logLevel === 'error' && ['error', 'fatal'].includes(data.level || 'info'))

      if (!shouldLog) {
        return // Log seviyesi uygun değilse kaydetme
      }

      const logEntry = {
        ...data,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      }

      // Try to log to database, but don't fail if database is not available
      try {
        await supabase
          .from('system_logs')
          .insert({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: data.type,
            level: data.level || 'info',
            userId: data.userId,
            adminId: data.adminId,
            action: data.action,
            description: data.description,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            endpoint: data.endpoint,
            method: data.method,
            statusCode: data.statusCode,
            responseTime: data.responseTime,
            error: data.error,
            stackTrace: data.stackTrace,
            createdAt: new Date().toISOString(),
          })
      } catch (dbError) {
        console.error('Failed to log to database:', dbError)
        // Fallback to console logging
        console.log(`[${data.type.toUpperCase()}] ${data.action}: ${data.description || ''}`, data)
      }
    } catch (error) {
      console.error('Failed to log:', error)
      // Fallback to console logging
      console.log(`[${data.type.toUpperCase()}] ${data.action}: ${data.description || ''}`, data)
    }
  }

  static async logUserLogin(userId: string, ipAddress?: string, userAgent?: string, success: boolean = true): Promise<void> {
    await this.log({
      type: 'user_login',
      level: success ? 'info' : 'warn',
      userId,
      action: 'user_login_attempt',
      description: success ? 'User logged in successfully' : 'User login failed',
      ipAddress,
      userAgent,
      metadata: { success }
    })
  }

  static async logAdminAction(adminId: string, action: string, description?: string, metadata?: Record<string, any>): Promise<void> {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await this.log({
      type: 'admin_action',
      level: 'info',
      adminId,
      action,
      description,
      metadata,
      ipAddress,
      userAgent
    })
  }

  static async logApiRequest(endpoint: string, method: string, statusCode: number, responseTime: number, userId?: string, adminId?: string): Promise<void> {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await this.log({
      type: 'api_request',
      level: statusCode >= 400 ? 'warn' : 'info',
      userId,
      adminId,
      action: 'api_request',
      description: `${method} ${endpoint} - ${statusCode}`,
      endpoint,
      method,
      statusCode,
      responseTime,
      ipAddress,
      userAgent
    })
  }

  static async logError(error: Error, context?: string, userId?: string, adminId?: string): Promise<void> {
    await this.log({
      type: 'error',
      level: 'error',
      userId,
      adminId,
      action: 'error_occurred',
      description: context || error.message,
      error: error.message,
      stackTrace: error.stack
    })
  }

  static async logSecurity(event: string, description: string, ipAddress?: string, userAgent?: string, userId?: string): Promise<void> {
    await this.log({
      type: 'security',
      level: 'warn',
      userId,
      action: event,
      description,
      ipAddress,
      userAgent,
      metadata: { security_event: true }
    })
  }

  static async logPerformance(metric: string, value: number, unit: string = 'ms', metadata?: Record<string, any>): Promise<void> {
    await this.log({
      type: 'performance',
      level: 'info',
      action: 'performance_metric',
      description: `${metric}: ${value}${unit}`,
      responseTime: value,
      metadata: { metric, unit, ...metadata }
    })
  }
}