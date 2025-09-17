"use client";

import React, { useMemo, useState } from "react";

export interface RateUserFormProps {
    /** Identificador del intercambio */
    exchangeId: string;
    /** Usuario a calificar */
    ratedUserId: string;
    /** Callback al enviar correctamente */
    onSubmitted?: () => void;
}

interface SubmitPayload {
    exchangeId: string;
    ratedUserId: string;
    score: number;
    comment?: string;
}

export default function RateUserForm({ exchangeId, ratedUserId, onSubmitted }: RateUserFormProps) {
    const [score, setScore] = useState<number>(5);
    const [comment, setComment] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    const stars = useMemo(() => [1, 2, 3, 4, 5], []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSubmitting(true);
        try {
            const payload: SubmitPayload = { exchangeId, ratedUserId, score, comment: comment.trim() || undefined };
            const res = await fetch("/api/ratings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("No se pudo enviar la calificación");
            setSuccess("¡Calificación enviada!");
            if (onSubmitted) onSubmitted();
        } catch (err: any) {
            setError(err?.message || "Error al enviar la calificación");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <div className="text-gray-900 font-medium mb-2">¿Cómo fue tu experiencia?</div>
                <div className="flex items-center gap-2">
                    {stars.map((s) => (
                        <button
                            type="button"
                            key={s}
                            className={`text-3xl transition-transform ${s <= score ? "text-yellow-400" : "text-gray-300"}`}
                            onClick={() => setScore(s)}
                            aria-label={`Calificar con ${s} ${s === 1 ? "estrella" : "estrellas"}`}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="rating-comment">
                    Comentario (opcional)
                </label>
                <textarea
                    id="rating-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={280}
                    className="w-full rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Cuéntanos brevemente cómo fue el intercambio"
                />
                <div className="text-xs text-gray-500 mt-1">{comment.length}/280</div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-emerald-600 text-sm">{success}</div>}

            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={submitting || score < 1}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-white font-medium disabled:opacity-60"
                >
                    {submitting ? "Enviando..." : "Enviar calificación"}
                </button>
            </div>
        </form>
    );
}



