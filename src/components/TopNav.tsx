"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useParams } from "next/navigation";

export default function TopNav() {
    const { data: session } = useSession();
    const params = useParams();
    const projectId = params?.projectId as string | undefined;

    return (
        <nav className="top-nav">
            <Link href="/" className="nav-brand">
                ridulian.md
            </Link>

            <div className="nav-actions">
                {projectId ? (
                    <Link href={`/editor/${projectId}/graph`} className="nav-link">
                        Universe Graph
                    </Link>
                ) : (
                    <span className="nav-link" style={{ color: 'var(--text-muted)', cursor: 'not-allowed' }}>
                        Universe Graph
                    </span>
                )}

                {session ? (
                    <>
                        <Link href="/dashboard" className="nav-link">
                            Terminals
                        </Link>
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
                    </>
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
