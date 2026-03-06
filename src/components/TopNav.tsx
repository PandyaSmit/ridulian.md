"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function TopNav() {
    const { data: session } = useSession();

    return (
        <nav className="top-nav">
            <Link href="/" className="nav-brand">
                ridulian.md
            </Link>

            <div className="nav-actions">
                <Link href="/graph" className="nav-link">
                    Universe Graph
                </Link>

                {session ? (
                    <div className="auth-profile">
                        <img
                            src={session.user?.image || ""}
                            alt="Avatar"
                            className="auth-avatar"
                        />
                        <span className="auth-name">{session.user?.name}</span>
                        <button
                            onClick={() => signOut()}
                            className="btn-auth btn-logout"
                        >
                            [ SEVER CONNECTION ]
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => signIn("github")}
                        className="btn-auth btn-login"
                    >
                        [ INITIATE HANDSHAKE: GITHUB ]
                    </button>
                )}
            </div>
        </nav>
    );
}
