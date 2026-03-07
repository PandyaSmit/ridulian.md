"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function TopNav() {
    const { data: session } = useSession();
    const params = useParams();
    const projectId = params?.projectId as string | undefined;

    return (
        <motion.nav
            className="top-nav"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <Link href="/" className="nav-brand">
                ridulian.md
            </Link>

            <div className="nav-actions">
                {projectId && (
                    <Link href={`/editor/${projectId}/graph`} className="nav-link">
                        Universe Graph
                    </Link>
                )}

                {session ? (
                    <>
                        <Link href="/dashboard" className="nav-link">
                            Codex
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
                                [ DEPART ARCHIVE ]
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        onClick={() => signIn("github")}
                        className="btn-auth btn-login"
                    >
                        [ PRESENT CREDENTIALS: GITHUB ]
                    </button>
                )}
            </div>
        </motion.nav>
    );
}
