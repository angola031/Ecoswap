import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { exchangeId, ratedUserId, score, comment } = body || {};

        if (!exchangeId || !ratedUserId || typeof score !== "number" || score < 1 || score > 5) {
            return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
        }

        // TODO: Persistir en base de datos real. Por ahora, simular éxito.
        const created = {
            id: `${Date.now()}`,
            exchangeId,
            ratedUserId,
            score,
            comment: typeof comment === "string" ? comment.trim() : undefined,
            createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ ok: true, rating: created }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
}



