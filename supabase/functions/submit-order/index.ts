import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const CATALOG: Record<string, { title: string; unit_price: number }> = {
  "glp3-12":    { title: "GLP-3 12mg", unit_price: 3900 },
  "glp3-24":    { title: "GLP-3 24mg", unit_price: 5400 },
  "glp3-48":    { title: "GLP-3 48mg", unit_price: 7400 },
  "bpc-tb500":  { title: "BPC-157 / TB-500 5mg/5mg", unit_price: 3700 },
  "cjc-1295":   { title: "CJC-1295 / Ipamorelin 5mg/5mg", unit_price: 3900 },
  "tesa-ipa":   { title: "Tesamorelin / Ipamorelin", unit_price: 4400 },
  "motsc-10":   { title: "MOTS-C 10mg", unit_price: 3900 },
  "dsip-10":    { title: "DSIP 10mg", unit_price: 3700 },
  "semax-10":   { title: "Semax / Selank", unit_price: 3700 },
  "glow-70":    { title: "GLOW Protocol 70mg", unit_price: 4900 },
  "epitalon":   { title: "Epitalon 10mg", unit_price: 3400 },
  "pt141":      { title: "PT-141 10mg", unit_price: 3400 },
  "bact-water-30": { title: "Agua Bacteriostatica 30ml", unit_price: 900 },
  "bact-water-3":  { title: "Agua Bacteriostatica 3ml", unit_price: 300 },
};

function norm(s: string): string {
  return s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const AIRTABLE_TOKEN = Deno.env.get("AIRTABLE_TOKEN") || "";
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") || "";
    const BASE_ID = "appKo9tyGtIju3UHN";

    const body = await req.json();
    const rawItems: Array<{ sku: string; quantity: number }> = body.items || [];

    if (rawItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid products in cart" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // ── Try to fetch stock from Airtable (best-effort, don't block payment) ──
    let stockMap: Record<string, number> = {};
    let priceMap: Record<string, number> = {};

    if (AIRTABLE_TOKEN) {
      try {
        const invRes = await fetch(
          `https://api.airtable.com/v0/${BASE_ID}/Inventario?pageSize=100`,
          { headers: { Authorization: "Bearer " + AIRTABLE_TOKEN } },
        );
        if (invRes.ok) {
          const invData = await invRes.json();
          for (const rec of invData.records || []) {
            const f = rec.fields || {};
            const raw = (f["P\u00e9ptido"] || "").toString().trim();
            if (!raw) continue;
            const key = norm(raw);
            stockMap[key] = Number(f["Stock Actual"] ?? 0);
            const p = Number(f["Precio"] ?? 0);
            if (p > 0) priceMap[key] = p;
          }
        }
      } catch {
        // Stock fetch failed — proceed without validation
      }
    }

    // ── Build MP items ──
    const mpItems: Array<{ title: string; quantity: number; unit_price: number }> = [];
    const warnings: string[] = [];

    for (const item of rawItems) {
      const catalog = CATALOG[item.sku];
      if (!catalog) {
        warnings.push(`SKU ${item.sku}: producto desconocido, omitido`);
        continue;
      }
      const key = norm(catalog.title);
      const available = stockMap[key] ?? -1;
      const price = priceMap[key] || catalog.unit_price;

      if (available >= 0 && available < item.quantity) {
        warnings.push(`${catalog.title}: solo ${available} en inventario, solicitaste ${item.quantity}`);
      }

      mpItems.push({
        title: catalog.title,
        quantity: item.quantity,
        unit_price: price,
      });
    }

    if (mpItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid products in cart", warnings }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // ── Parse shipping ──
    const s = body.shipping || {};
    const nombre = s.name || "";
    const telefono = s.phone || "";
    const email = s.email || "";
    const direccion = s.address || "";
    const estado = s.state || "";
    const ciudad = s.ciudad || "";
    const codigo_postal = s.zip || "";

    const itemsTotal = mpItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const consultPrice = body.upsell === true ? 1500 : 0;
    const total = itemsTotal + consultPrice;
    const orderId = "ORD-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    // ── Save order to Airtable (best-effort) ──
    if (AIRTABLE_TOKEN) {
      try {
        const now = new Date().toISOString().split("T")[0];
        const productNames = mpItems.map((i) => i.title).join(", ");
        await fetch(`https://api.airtable.com/v0/${BASE_ID}/Ordenes`, {
          method: "POST",
          headers: { Authorization: "Bearer " + AIRTABLE_TOKEN, "Content-Type": "application/json" },
          body: JSON.stringify({
            records: [{
              fields: {
                Cliente: nombre, Telefono: telefono, Email: email,
                Direccion: direccion, Ciudad: ciudad, Estado: estado,
                "Codigo Postal": codigo_postal, Productos: productNames,
                Total: String(total), "Upsell Consulta": body.upsell === true ? "Si" : "No",
                "Order ID": orderId, Estatus: "Pendiente", Fecha: now,
              },
            }],
          }),
        });
      } catch { /* best-effort */ }
    }

    // ── Create Mercado Pago preference ──
    if (!MP_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago no configurado. Contacta al administrador.", warnings, order_id: orderId }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: "Bearer " + MP_ACCESS_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: mpItems,
        external_reference: orderId,
        back_urls: {
          success: "https://peptbiohacking.com/checkout.html",
          failure: "https://peptbiohacking.com/checkout.html",
          pending: "",
        },
        auto_return: "approved",
        notification_url: "https://myymemctdxwizhmwjbyk.supabase.co/functions/v1/mp-webhook",
      }),
    });

    const mpData = await mpRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        init_point: mpData.init_point || mpData.sandbox_init_point,
        total,
        order_id: orderId,
        warnings,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error del servidor: " + error.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});