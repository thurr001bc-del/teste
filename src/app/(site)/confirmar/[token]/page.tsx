import { notFound } from "next/navigation";
import { getAppointmentByToken } from "@/lib/queries";
import { getDefaultBarbershop } from "@/lib/db";
import { ConfirmationPanel } from "@/components/site/confirmation-panel";

export default function ConfirmarPage({ params }: { params: { token: string } }) {
  const apt = getAppointmentByToken(params.token);
  if (!apt) notFound();
  const shop = getDefaultBarbershop();

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent-soft/30 to-background">
      <ConfirmationPanel
        appointment={{
          id: apt.id,
          token: apt.token,
          customerName: apt.customerName,
          serviceId: apt.serviceId,
          serviceName: apt.service.name,
          barberName: apt.barber.name,
          date: apt.date,
          startTime: apt.startTime,
          endTime: apt.endTime,
          duration: apt.duration,
          price: apt.price,
          status: apt.status,
        }}
        message={shop.settings.confirmationMessage}
        currency={shop.settings.currency}
      />
    </div>
  );
}
