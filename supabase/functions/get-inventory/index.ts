import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const AIRTABLE_TOKEN = Deno.env.get("AIRTABLE_TOKEN") || "";
const BASE_ID = "appKo9tyGtIju3UHN"; // Peptbiohacking base

serve(async (req) => {
  try {
    // Fetch from Airtable Inventario table
    const atRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Inventario?pageSize=100`,
      {
        headers: { Authorization: "Bearer " + AIRTABLE_TOKEN }
      }
    );
    const atData = await atRes.json();

    if (!atData.records) {
      return new Response(JSON.stringify({ error: "No data" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Map Airtable records to inventory format
    const inventory = atData.records.map((r) => {
      const f = r.fields || {};
      const stock = Number(f["Stock Actual"]) || 0;
      let status = "In Stock";
      if (stock <= 0) status = "Out of Stock";
      else if (stock <= 5) status = "Low Stock";
      return {
        sku: String(f["#"] || ""),
        product: f["Péptido"] || "",
        stock: stock,
        status: status,
        price: 0,
        lowAlert: 5
      };
    }).filter((i) => i.product);

    const summary = {
      inStock: inventory.filter((i) => i.status === "In Stock").length,
      lowStock: inventory.filter((i) => i.status === "Low Stock").length,
      outOfStock: inventory.filter((i) => i.status === "Out of Stock").length,
      totalSKUs: inventory.length,
      totalUnits: inventory.reduce((s, i) => s + i.stock, 0)
    };

    return new Response(
      JSON.stringify({
        inventory: inventory,
        summary: summary,
        updated: new Date().toISOString()
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});