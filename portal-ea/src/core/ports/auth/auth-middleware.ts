import type { NextRequest, NextResponse } from 'next/server'

export interface AuthMiddleware {
  protect(request: NextRequest): Promise<NextResponse>
}
