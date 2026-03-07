"use client";

import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';

export default function HeroButton() {
    const { data: session } = useSession();

    if (session) {
        return (
            <Link
                href="/dashboard"
                className="btn-auth"
                style={{
                    padding: '1rem 2rem',
                    fontSize: '1.2rem',
                    borderColor: 'var(--interactive)',
                    color: 'var(--interactive)',
                    display: 'inline-block',
                    textDecoration: 'none'
                }}
            >
                Access Codex
            </Link>
        );
    }

    return (
        <button
            onClick={() => signIn("github")}
            className="btn-auth btn-login"
            style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                cursor: 'pointer'
            }}
        >
            [ PRESENT CREDENTIALS ]
        </button>
    );
}
