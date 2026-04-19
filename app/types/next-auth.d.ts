import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'PARENT' | 'TRAINER';
      sessionVersion?: number;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'PARENT' | 'TRAINER';
    sessionVersion?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'PARENT' | 'TRAINER';
    sessionVersion?: number;
  }
}
