import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { env, DEMO_MODE, isPlatformAdmin } from "./env";
import { DEMO_USER } from "./demo";

/**
 * Auth configuration.
 * - Real mode: Discord OAuth2 authorization-code flow, requesting identify,
 *   email and guilds scopes. The access token is stored in the JWT so we can
 *   fetch the user's guilds server-side.
 * - Demo mode: a single mock credentials provider so the UI is reviewable
 *   locally without Discord credentials.
 */

/**
 * Minimum scopes Snowy needs. Deliberately excludes `email`:
 *   identify -> user id, username, avatar (to show who is signed in)
 *   guilds   -> the servers the user is in (to build the server selector)
 * We never use the email address, so we don't ask for it. Requesting less
 * means less to leak and a shorter consent screen for the user.
 */
const scopes = ["identify", "guilds"].join(" ");

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: env.NEXTAUTH_SECRET ?? "dev-insecure-secret-change-me",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: DEMO_MODE
    ? [
        CredentialsProvider({
          name: "Demo",
          credentials: {},
          async authorize() {
            return {
              id: DEMO_USER.id,
              name: DEMO_USER.global_name ?? DEMO_USER.username,
              email: DEMO_USER.email ?? null,
              image: null,
            };
          },
        }),
      ]
    : [
        DiscordProvider({
          clientId: env.DISCORD_CLIENT_ID!,
          clientSecret: env.DISCORD_CLIENT_SECRET!,
          authorization: { params: { scope: scopes } },
        }),
      ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      if (profile) {
        // Discord profile fields
        const p = profile as any;
        token.discordId = p.id ?? DEMO_USER.id;
        token.username = p.username ?? DEMO_USER.username;
        token.globalName = p.global_name ?? null;
        token.avatar = p.avatar ?? null;
      }
      if (DEMO_MODE && !token.discordId) {
        token.discordId = DEMO_USER.id;
        token.username = DEMO_USER.username;
        token.globalName = DEMO_USER.global_name;
        token.avatar = DEMO_USER.avatar;
      }
      token.isAdmin = isPlatformAdmin(token.discordId as string) || DEMO_MODE;
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.user = {
        ...session.user,
        discordId: token.discordId as string,
        username: token.username as string,
        globalName: (token.globalName as string) ?? null,
        avatar: (token.avatar as string) ?? null,
        isAdmin: Boolean(token.isAdmin),
      };
      return session;
    },
  },
};
