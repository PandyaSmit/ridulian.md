"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Spinner from './Spinner';

export default function HeroButton() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleAccessCodex = () => {
        setIsNavigating(true);
        router.push('/dashboard');
    };

    const handleLogin = () => {
        setIsLoggingIn(true);
        signIn("github");
    };

    if (session) {
        return (
            <button
                onClick={handleAccessCodex}
                disabled={isNavigating}
                className="btn-auth"
                style={{
                    padding: '1rem 2rem',
                    fontSize: '1.2rem',
                    borderColor: 'var(--interactive)',
                    color: 'var(--interactive)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: isNavigating ? 'default' : 'pointer',
                    opacity: isNavigating ? 0.7 : 1
                }}
            >
                {isNavigating && <Spinner size={18} />}
                Access Codex
            </button>
        );
    }

    return (
        <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="btn-auth btn-login"
            style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                cursor: isLoggingIn ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isLoggingIn ? 0.7 : 1
            }}
        >
            {isLoggingIn && <Spinner size={18} />}
            [ PRESENT CREDENTIALS ]
        </button>
    );
}
