import VerifyEmailClient from "./VerifyEmailClient";

type VerifyEmailPageProps = {
  searchParams?: {
    token?: string;
  };
};

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = searchParams?.token ?? null;
  return <VerifyEmailClient token={token} />;
}
