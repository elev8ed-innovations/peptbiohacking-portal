import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    // MP sends POST with topic/type + id
    const body = await req.json();
    const paymentId = body.data?.id || body.id || "";
    const topic = body.type || body.topic || "";

    if (topic !== "payment" && topic !== "merchant_order" && !paymentId) {
      return new Response("OK", { status: 200 }); // Acknowledge but ignore
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") || "";
    const AIRTABLE_TOKEN = Deno.env.get("AIRTABLE_TOKEN") || "";
    const BASE_ID = "appKo9tyGtIju3UHN";

    // Fetch payment details from MP
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: "Bearer " + MP_ACCESS_TOKEN },
      }
    );

    if (!mpRes.ok) {
      console.error(`Failed to fetch payment ${paymentId}: ${mpRes.status}`);
      return new Response("OK", { status: 200 });
    }

    const payment = await mpRes.json();
    const status = payment.status; // approved, rejected, pending, etc.
    const externalRef = payment.external_reference || "";

    if (!externalRef) {
      console.error(`Payment ${paymentId} has no external_reference`);
      return new Response("OK", { status: 200 });
    }

    // Map MP status to our status
    let newStatus = "";
    if (status === "approved") newStatus = "Pagado";
    else if (status === "rejected") newStatus = "Rechazado";
    else if (status === "cancelled") newStatus = "Cancelado";
    else if (status === "refunded") newStatus = "Reembolsado";
    else if (status === "in_process") newStatus = "En Proceso";
    else return new Response("OK", { status: 200 }); // Pending — wait

    // Find the Airtable order by Order ID
    const searchRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Ordenes?filterByFormula=${encodeURIComponent(
        `{Order ID}="${externalRef}"`
      )}`,
      {
        headers: { Authorization: "Bearer " + AIRTABLE_TOKEN },
      }
    );
    const searchData = await searchRes.json();
    const records = searchData.records || [];

    if (records.length === 0) {
      console.error(`No Airtable order found for Order ID: ${externalRef}`);
      return new Response("OK", { status: 200 });
    }

    const recordId = records[0].id;

    // Update Airtable order status
    await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Ordenes`,
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + AIRTABLE_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              id: recordId,
              fields: { Estatus: newStatus },
            },
          ],
        }),
      }
    );

    // If approved, decrement stock
    if (status === "approved") {
      const fields = records[0].fields || {};
      const productos = (fields.Productos || "") as string;
      const products = productos.split(", ").filter(Boolean);

      // Fetch current inventory
      const invRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Inventario?pageSize=30`,
        {
          headers: { Authorization: "Bearer " + AIRTABLE_TOKEN },
        }
      );
      const invData = await invRes.json();

      for (const productName of products) {
        // Normalize both sides for comparison
        const normProduct = (productName || "").trim().toLowerCase()
          .replace(/\s*\/\s*/g, "/")
          .replace(/[áéíóú]/g, (c: string) => "aeiou"["áéíóú".indexOf(c)]);

        // Find matching inventory record
        const invRecord = (invData.records || []).find((r: any) => {
          const invName = (r.fields?.["Péptido"] || "").trim().toLowerCase()
            .replace(/\s*\/\s*/g, "/")
            .replace(/[áéíóú]/g, (c: string) => "aeiou"["áéíóú".indexOf(c)]);
          return invName === normProduct ||
            invName.includes(normProduct) ||
            normProduct.includes(invName);
        });

        if (invRecord) {
          const currentStock = Number(invRecord.fields["Stock Actual"] || 0);
          const newStock = Math.max(0, currentStock - 1); // Decrement by 1

          await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/Inventario`,
            {
              method: "PATCH",
              headers: {
                Authorization: "Bearer " + AIRTABLE_TOKEN,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                records: [
                  {
                    id: invRecord.id,
                    fields: { "Stock Actual": newStock },
                  },
                ],
              }),
            }
          );

          // Also increment Total Entregado
          const totalEntregado = Number(invRecord.fields["Total Entregado"] || 0);
          await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/Inventario`,
            {
              method: "PATCH",
              headers: {
                Authorization: "Bearer " + AIRTABLE_TOKEN,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                records: [
                  {
                    id: invRecord.id,
                    fields: { "Total Entregado": totalEntregado + 1 },
                  },
                ],
              }),
            }
          );
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    // Always return 200 to MP — they'll retry if we error
    console.error("Webhook error:", error);
    return new Response("OK", { status: 200 });
  }
});
