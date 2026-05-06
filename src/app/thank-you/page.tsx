import ThankYouClient from "./ThankYouClient";

type ThankYouPageProps = {
  searchParams?: { order?: string };
};

export default function ThankYouPage({ searchParams }: ThankYouPageProps) {
  return <ThankYouClient orderId={searchParams?.order} />;
}
