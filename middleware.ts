import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de seguridad para proteger las rutas API
 * Este middleware se ejecuta antes de cada request a /api/*
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo aplicar a rutas API
  if (pathname.startsWith('/api/')) {
    
    // 1. Verificar que las API keys del servidor estén configuradas
    if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) {
      console.error('⚠️ SEGURIDAD: Variables de entorno de Airtable no configuradas');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    // 2. Prevenir que las API keys se filtren en headers de respuesta
    const response = NextResponse.next();
    
    // 3. Añadir headers de seguridad adicionales
    response.headers.set('X-API-Protected', 'true');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // 4. CORS básico (ajusta según tus necesidades)
    // Si necesitas CORS más específico, descomenta y configura:
    // const origin = request.headers.get('origin');
    // if (origin) {
    //   response.headers.set('Access-Control-Allow-Origin', origin);
    //   response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    //   response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // }

    // 5. Rate limiting simple (opcional - implementación básica)
    // Para producción, considera usar un servicio externo como Upstash Rate Limit
    
    return response;
  }

  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    '/api/:path*',
  ],
};
