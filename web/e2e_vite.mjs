import { createServer } from 'vite';

process.env.VITE_DEV_CLIENT_ID = 'e2e-dashboard';
process.env.VITE_DEV_CLIENT_SECRET = 'e2e-dashboard-secret';
const server = await createServer({
  server: { host: '0.0.0.0', port: 5173 },
});
await server.listen();
await server.printUrls();
