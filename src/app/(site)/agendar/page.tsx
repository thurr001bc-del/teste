import { getPublicData } from "@/lib/queries";
import { BookingFlow } from "@/components/site/booking-flow";

export default function AgendarPage({
  searchParams,
}: {
  searchParams: { servico?: string };
}) {
  const data = getPublicData("vanguard");
  if (!data) return null;
  return (
    <div className="py-8">
      <BookingFlow
        services={data.services}
        barbers={data.barbers}
        currency={data.shop.settings.currency}
        initialServiceId={searchParams.servico}
      />
    </div>
  );
}
