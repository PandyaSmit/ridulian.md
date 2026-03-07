"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Spinner from "./Spinner";

export default function TopNav() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const projectId = params?.projectId as string | undefined;

    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    // Reset navigation state when path changes
    useEffect(() => {
        setNavigatingTo(null);
    }, [pathname]);

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        if (pathname === path) return;
        setNavigatingTo(path);
    };

    const handleLogin = () => {
        setIsLoggingIn(true);
        signIn("github");
    };

    const handleLogout = () => {
        setIsLoggingOut(true);
        signOut();
    };

    return (
        <motion.nav
            className="top-nav"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <Link href="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                ridulian.md
            </Link>

            <div className="nav-actions">
                {projectId && (
                    <Link
                        href={`/editor/${projectId}/graph`}
                        className="nav-link"
                        onClick={(e) => handleNavigation(e, `/editor/${projectId}/graph`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', pointerEvents: navigatingTo === `/editor/${projectId}/graph` ? 'none' : 'auto', opacity: navigatingTo === `/editor/${projectId}/graph` ? 0.7 : 1 }}
                    >
                        {navigatingTo === `/editor/${projectId}/graph` && <Spinner size={14} />}
                        Universe Graph
                    </Link>
                )}

                <Link href="/about" className="nav-link" style={{ marginRight: '1rem' }}>
                    [ THE ARCHITECT ]
                </Link>
                <Link href="/guide" className="nav-link" style={{ marginRight: '1rem' }}>
                    [ ARCHIVE GUIDE ]
                </Link>

                {session ? (
                    <>
                        <Link
                            href="/dashboard"
                            className="nav-link"
                            onClick={(e) => handleNavigation(e, '/dashboard')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', pointerEvents: navigatingTo === '/dashboard' ? 'none' : 'auto', opacity: navigatingTo === '/dashboard' ? 0.7 : 1 }}
                        >
                            {navigatingTo === '/dashboard' && <Spinner size={14} />}
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
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="btn-auth btn-logout"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isLoggingOut ? 'default' : 'pointer', opacity: isLoggingOut ? 0.7 : 1 }}
                            >
                                {isLoggingOut && <Spinner size={14} />}
                                [ DEPART ARCHIVE ]
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className="btn-auth btn-login"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isLoggingIn ? 'default' : 'pointer', opacity: isLoggingIn ? 0.7 : 1 }}
                    >
                        {isLoggingIn && <Spinner size={14} />}
                        [ PRESENT CREDENTIALS: GITHUB ]
                    </button>
                )}
            </div>
        </motion.nav>
    );
}
