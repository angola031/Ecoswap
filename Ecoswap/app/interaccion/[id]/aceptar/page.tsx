import Link from "next/link";
import { notFound } from "next/navigation";
import AcceptExchangeForm from "@/components/interactions/AcceptExchangeForm";

interface AceptarPageProps {
    params: { id?: string };
}

export default function AceptarInteraccionPage({ params }: AceptarPageProps) {
    const exchangeId = params?.id;
    if (!exchangeId) return notFound();

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link href={`/?m=interactions`} className="text-sm text-gray-600 hover:text-gray-900">
                        ← Volver
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Confirmar intercambio</h1>
                </div>
            </header>

            <section className="bg-white rounded-lg border border-gray-200 p-6">
                <AcceptExchangeForm exchangeId={exchangeId} />
            </section>
        </div>
    );
}


