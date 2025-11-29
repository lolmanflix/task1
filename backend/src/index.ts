import app from './app';
import dotenv from 'dotenv';
import { pruneExpiredSessions } from './services/auth.service';

dotenv.config();

const port = process.env.PORT || 4000;

// runtime checks for production security
if (process.env.NODE_ENV === 'production') {
  const frontend = process.env.FRONTEND_ORIGIN || '';
  if (!frontend.startsWith('https://')) {
    console.error('SECURITY WARNING: FRONTEND_ORIGIN does not use HTTPS — secure cookies will not be safe.');
    if (process.env.ENFORCE_HTTPS === 'true') {
      throw new Error('ENFORCE_HTTPS is enabled and FRONTEND_ORIGIN is not HTTPS. Aborting start.');
    }
  }
  // trust proxy is important when running behind a load balancer so Express sets cookies correctly
  if (!process.env.TRUST_PROXY && !process.env.DISABLE_TRUST_PROXY_WARNING) {
    console.warn('TIP: Running in production without TRUST_PROXY set. If you are behind a reverse proxy you should set TRUST_PROXY=1 to ensure secure cookies and protocol detection work correctly.');
  }
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

// run cleanup job every hour to remove expired sessions
setInterval(() => {
  pruneExpiredSessions().catch((err) => console.warn('Prune sessions error', err));
}, 1000 * 60 * 60);
