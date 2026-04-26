/**
 * Base URL of the API Gateway.
 *
 * Dev (`ng serve` sur :4200) : appels directs vers le Gateway (cross-origin) —
 * CORS est géré par Spring Cloud Gateway (voir `Gateway/.../application.properties`).
 */
const DEFAULT_GATEWAY = 'http://localhost:8084';
/** VEM direct (port 8086) — STOMP WebSocket n’est en général pas routé par le Gateway. */
const DEFAULT_VEM = 'http://localhost:8086';

let cachedGateway: string | null = null;
let cachedVem: string | null = null;

export function getGatewayBase(): string {
  if (cachedGateway !== null) {
    return cachedGateway;
  }
  cachedGateway = DEFAULT_GATEWAY;
  return cachedGateway;
}

/** Base du microservice Virtual Event (HTTP + SockJS en `/ws`). */
export function getVemBaseUrl(): string {
  if (cachedVem !== null) {
    return cachedVem;
  }
  cachedVem = DEFAULT_VEM;
  return cachedVem;
}

/** Ex. `apiUrl('/api/events')` → `http://localhost:8084/api/events`. */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const b = getGatewayBase();
  return `${b.replace(/\/$/, '')}${p}`;
}
