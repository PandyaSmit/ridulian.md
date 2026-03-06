import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            // Explicitly append the user's ID to the session object for S3 tenant pathing
            if (session?.user) {
                // next-auth JWT token.sub usually contains the provider's unique user ID
                (session.user as any).id = token.sub;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
};
