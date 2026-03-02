import VerifyEmailClient from "./VerifyEmailClient";

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = params?.token ?? null;
  return <VerifyEmailClient token={token} />;
}
