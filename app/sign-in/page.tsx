import { SignInForm } from "./sign-in-form";

type SignInPageProps = Readonly<{
  searchParams: Promise<{ reason?: string }>;
}>;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { reason } = await searchParams;

  return (
    <main className="auth-page">
      <SignInForm sessionExpired={reason === "session-expired"} />
    </main>
  );
}
