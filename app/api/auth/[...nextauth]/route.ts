import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

const LOGIN_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  cleanupAfterMs: 24 * 60 * 60 * 1000,
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getWindowStart(nowMs: number, windowMs: number) {
  return new Date(Math.floor(nowMs / windowMs) * windowMs);
}

function getClientIp(req?: Request) {
  if (!req) return null;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = normalizeEmail(credentials.email);
        const ip = getClientIp(req) ?? 'unknown';
        const nowMs = Date.now();
        const windowStart = getWindowStart(nowMs, LOGIN_RATE_LIMIT.windowMs);
        const key = `${email}|${ip}`;

        await prisma.loginAttempt.deleteMany({
          where: {
            windowStart: { lt: new Date(nowMs - LOGIN_RATE_LIMIT.cleanupAfterMs) },
          },
        });

        const attempt = await prisma.loginAttempt.upsert({
          where: { key_windowStart: { key, windowStart } },
          create: { key, email, ip, windowStart, count: 1 },
          update: { count: { increment: 1 } },
        });

        if (attempt.count > LOGIN_RATE_LIMIT.maxAttempts) {
          throw new Error('RateLimit');
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        await prisma.loginAttempt.deleteMany({
          where: { key },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
