import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { exchangeId, location, date, time, notes } = body || {};
        if (!exchangeId || !location || !date || !time) {
            return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
        }

        // TODO: Persistir aceptación real.
        const acceptance = {
            id: `${Date.now()}`,
            exchangeId,
            location: String(location).trim(),
            date,
            time,
            notes: typeof notes === "string" ? notes.trim() : undefined,
            status: "accepted",
            createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ ok: true, acceptance }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
    }
}


