import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    state?: string | string[];
  }>;
}) {
  const state = (await searchParams).state;

  return (
    <ForgotPasswordForm
      invalidLink={state === "invalid_link"}
    />
  );
}
