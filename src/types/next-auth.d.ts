import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discordId: string;
      username: string;
      globalName: string | null;
      avatar: string | null;
      isAdmin: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    discordId?: string;
    username?: string;
    globalName?: string | null;
    avatar?: string | null;
    isAdmin?: boolean;
  }
}
