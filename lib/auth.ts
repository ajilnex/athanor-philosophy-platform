import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, user }: any) {
      // Inclure l'ID de l'utilisateur et son rôle dans la session
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role; // Le champ 'role' vient de notre schéma Prisma
      }
      return session;
    },
  },
};