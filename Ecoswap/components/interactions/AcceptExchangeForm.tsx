"use client";

import React, { useState } from "react";

export interface AcceptExchangeFormProps {
    exchangeId: string;
    onAccepted?: () => void;
}

interface AcceptPayload {
    exchangeId: string;
    location: string;
    date: string; // ISO date
    time: string; // HH:mm
    notes?: string;
}

export default function AcceptExchangeForm({ exchangeId, onAccepted }: AcceptExchangeFormProps) {
    const [location, setLocation] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSubmitting(true);
        try {
            const payload: AcceptPayload = { exchangeId, location: location.trim(), date, time, notes: notes.trim() || undefined };
            const res = await fetch("/api/interactions/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("No se pudo confirmar el intercambio");
            setSuccess("Intercambio aceptado correctamente");
            if (onAccepted) onAccepted();
        } catch (err: any) {
            setError(err?.message || "Error al aceptar el intercambio");
        } finally {
            setSubmitting(false);
        }
    }

    const canSubmit = location.trim().length >= 3 && !!date && !!time;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">Lugar de encuentro</label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Centro Comercial Pereira Plaza"
                        className="w-full rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">Fecha</label>
                    <input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="time">Hora</label>
                    <input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">Notas (opcional)</label>
                <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalles adicionales para coordinar el encuentro"
                    className="w-full rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-emerald-600 text-sm">{success}</div>}

            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={submitting || !canSubmit}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-white font-medium disabled:opacity-60"
                >
                    {submitting ? "Confirmando..." : "Confirmar intercambio"}
                </button>
            </div>
        </form>
    );
}


