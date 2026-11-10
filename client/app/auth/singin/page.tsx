"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

type AuthResponse = {
  message?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    access_token: string;
  };
};

type GoogleCredentialResponse = { credential?: string };

type GoogleIdApi = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    element: HTMLElement,
    options: { theme: "outline"; size: "large"; text: "continue_with"; shape: "pill"; width: number },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

function GoogleSignInButton({
  onCredential,
  onMissingClientId,
}: {
  onCredential: (credential: string) => void;
  onMissingClientId: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    let cancelled = false;
    const renderGoogleButton = () => {
      if (cancelled || !containerRef.current || !window.google) return;

      containerRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) onCredential(response.credential);
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: Math.min(containerRef.current.clientWidth, 360),
      });
    };

    if (window.google) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    let script = document.querySelector<HTMLScriptElement>("script[data-google-identity]");
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.dataset.googleIdentity = "true";
      document.head.appendChild(script);
    }
    script.addEventListener("load", renderGoogleButton);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderGoogleButton);
    };
  }, [clientId, onCredential]);

  if (clientId) return <div ref={containerRef} className="flex min-h-10 justify-center" />;

  return (
    <button
      type="button"
      onClick={onMissingClientId}
      className="mx-auto flex h-10 w-full max-w-sm items-center justify-center gap-3 rounded-full border border-white/25 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
        <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
        <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
        <path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 17.9l6.8-5.2Z" />
        <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z" />
      </svg>
      Continue with Google
    </button>
  );
}

function BrandLogo({ isSignUp }: { isSignUp: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3"
      aria-label="IFAAYE Mart home"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 42 30"
        className="h-8 w-11"
        fill="none"
      >
        <path
          d="M2 27V3L13 16 22 3 31 16 40 3V27L31 17 22 28 13 17 2 27Z"
          fill="#C7A331"
        />
      </svg>
      <span className="leading-tight">
        <span className="block text-xl font-bold tracking-tight text-white">
          IFAAYE<span className="font-normal text-[#c7a331]">MART</span>
        </span>
        <span className={`block text-[9px] ${isSignUp ? "text-emerald-50/80" : "text-slate-400"}`}>
          Thoughtful shopping, made simple
        </span>
      </span>
    </Link>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function changeMode(signUp: boolean) {
    setIsSignUp(signUp);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const apiBase = "/api";
      const endpoint = isSignUp ? "/user" : "/user/login";
      const body = isSignUp
        ? { name: fullName, email, password }
        : { email, password };

      const response = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as AuthResponse;

      if (!response.ok) {
        setError(result.message ?? "Codsiga lama dhammaystiri karin.");
        return;
      }

      if (isSignUp) {
        setIsSignUp(false);
        setPassword("");
        setSuccess("Akoonka waa la sameeyay. Hadda ku gal email-kaaga iyo password-kaaga.");
        return;
      }

      if (!result.user) {
        setError("Login-ku ma guulaysan. Fadlan mar kale isku day.");
        return;
      }

      window.localStorage.setItem("user-data", JSON.stringify(result.user));
      window.dispatchEvent(new Event("auth-change"));
      router.push("/");
    } catch {
      setError("Adeegga lama heli karo. Fadlan mar kale isku day.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setError("");
    setIsSubmitting(true);

    try {
      const apiBase = "/api";
      const response = await fetch(`${apiBase}/user/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const result = (await response.json()) as AuthResponse;

      if (!response.ok || !result.user) {
        setError(result.message ?? "Google login-ku ma guulaysan.");
        return;
      }

      window.localStorage.setItem("user-data", JSON.stringify(result.user));
      window.dispatchEvent(new Event("auth-change"));
      router.push("/");
    } catch {
      setError("Google login-ku ma shaqayn. Fadlan mar kale isku day.");
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  function handleMissingGoogleClientId() {
    setError("Google login wali lama xirin. Waxaa loo baahan yahay dejinta Google OAuth.");
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-slate-100 p-4 sm:p-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl md:min-h-[560px] md:grid-cols-2">
        <aside className={`flex flex-col justify-center px-8 py-10 text-white transition-colors duration-700 ease-in-out sm:px-12 md:px-14 ${isSignUp ? "bg-[#173744]" : "bg-[#34d399]"}`}>
          <p className={`mb-3 text-xs font-bold uppercase tracking-[0.22em] transition-colors duration-700 ${isSignUp ? "text-emerald-100/70" : "text-emerald-950/70"}`}>
            IFAAYE MART
          </p>
          <h1 className={`max-w-sm text-4xl font-bold leading-tight transition-colors duration-700 sm:text-5xl ${isSignUp ? "text-white" : "text-emerald-950"}`}>
            {isSignUp ? "Join IFAAYE Mart." : "Shopping made simple."}
          </h1>
          <p className={`mt-4 max-w-sm text-base transition-colors duration-700 ${isSignUp ? "text-slate-200" : "text-emerald-950/80"}`}>
            {isSignUp
              ? "Create an account to get started with easy everyday shopping."
              : "Sign in to find your everyday essentials and enjoy a smoother way to shop."}
          </p>

          <ul className={`mt-9 space-y-4 text-sm font-medium transition-colors duration-700 ${isSignUp ? "text-slate-200" : "text-emerald-950/90"}`}>
            <li className="flex items-center gap-3"><span aria-hidden="true">&#8226;</span> Browse products with ease</li>
            <li className="flex items-center gap-3"><span aria-hidden="true">&#8226;</span> Keep your account in one place</li>
            <li className="flex items-center gap-3"><span aria-hidden="true">&#8226;</span> Get back to shopping quickly</li>
          </ul>
        </aside>

        <div className={`flex flex-col justify-center px-8 py-10 text-white transition-colors duration-700 ease-in-out sm:px-12 md:px-14 ${isSignUp ? "bg-emerald-700" : "bg-[#173744]"}`}>
          <BrandLogo isSignUp={isSignUp} />

          <div className="mt-9 flex items-center gap-4 border-b border-white/15 pb-4 text-sm font-medium">
            <button
              type="button"
              onClick={() => changeMode(false)}
              className={isSignUp ? "text-slate-300 transition hover:text-white" : "text-white"}
            >
              Sign In
            </button>
            <span aria-hidden="true" className="h-4 border-l border-emerald-400" />
            <button
              type="button"
              onClick={() => changeMode(true)}
              className={isSignUp ? "text-white" : "text-slate-300 transition hover:text-white"}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-6">
            {isSignUp && (
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-200">
                  Fullname
                </span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Enter your full name"
                  className="mt-2 block w-full border-0 border-b border-slate-400/70 bg-transparent py-2 pl-2 pr-0 text-sm text-white outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-0"
                />
              </label>
            )}

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-200">
                Email
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                className="mt-2 block w-full border-0 border-b border-slate-400/70 bg-transparent py-2 pl-2 pr-0 text-sm text-white outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-0"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-200">
                Password
              </span>
              <input
                type="password"
                name="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="mt-2 block w-full border-0 border-b border-slate-400/70 bg-transparent py-2 pl-2 pr-0 text-sm text-white outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-0"
              />
            </label>

            {success && <p role="status" className="text-sm text-emerald-300">{success}</p>}
            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="block h-10 w-full rounded-full bg-[#ed4035] text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#df372d] disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting
                ? isSignUp ? "Creating account..." : "Signing in..."
                : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          {!isSignUp && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-slate-300">
                <span className="h-px flex-1 bg-white/30" />
                <span>OR</span>
                <span className="h-px flex-1 bg-white/30" />
              </div>
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                onMissingClientId={handleMissingGoogleClientId}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
