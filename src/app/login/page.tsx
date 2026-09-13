import { SignInButton } from "./SignInButton";

const ERRORS: Record<string, string> = {
  "not-allowed": "That Google account is not on the family list.",
  "sign-in-failed": "Sign-in did not finish. Please try again.",
  "missing-code": "Sign-in did not finish. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="text-7xl">🧩</div>
      <h1 className="font-display text-4xl font-extrabold">Puzzle Quest</h1>
      <p className="text-lg text-cream-dim">Grown-ups: sign in once on this device.</p>
      {message && <p className="rounded-xl bg-danger/20 px-4 py-2 text-lg">{message}</p>}
      <SignInButton />
    </main>
  );
}
