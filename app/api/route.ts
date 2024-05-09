import { getRegisteredRoutes } from '@/lib/route-registar';

export function GET() {
  return Response.json({ message: getRegisteredRoutes() });
}
