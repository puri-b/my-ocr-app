export const runtime = "nodejs";

// Next.js App Router API Route
// รับ requestBody จาก client แล้วเรียก Gemini (Generative Language API) ฝั่ง server

export async function POST(req) {
  try {
    const { requestBody, meta } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        {
          error: {
            message:
              "Missing GEMINI_API_KEY. กรุณาสร้างไฟล์ .env.local แล้วใส่ GEMINI_API_KEY=...",
          },
        },
        { status: 500 }
      );
    }

    // หมายเหตุ: inlineData สำหรับ PDF อาจไม่รองรับในบางโมเดล/บาง endpoint
    // ถ้าใช้ PDF แล้ว error แนะนำแปลง PDF -> รูป (PNG/JPG) ก่อนส่ง

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!upstream.ok) {
      // ส่งต่อ error จาก Google แบบโปร่งใส เพื่อ debug ได้ง่าย
      return Response.json(
        {
          ...data,
          _debug: {
            meta,
            status: upstream.status,
            statusText: upstream.statusText,
          },
        },
        { status: upstream.status }
      );
    }

    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: { message: err?.message || "Unknown server error" } },
      { status: 500 }
    );
  }
}
