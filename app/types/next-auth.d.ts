import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'PARENT' | 'TRAINER';
    } & DefaultSession['user'];
  }
}
