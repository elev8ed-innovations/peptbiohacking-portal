import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const AIRTABLE_TOKEN=Deno.env.get("AIRTABLE_TOKEN") || "";
const BASE_ID = "appKo9tyGtIju3UHN"; // Peptbiohacking base

serve(async (req) => {
  try {
    if (req.method === "GET") {
      // Return open tickets from Airtable Tech Tickets table
      const atRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Tech%20Tickets?pageSize=50&sort[0][field]=Created&sort[0][direction]=desc`,
        {
          headers: { Authorization: "Bearer " + AIRTABLE_TOKEN }
        }
      );
      const atData = await atRes.json();

      if (!atData.records) {
        return new Response(JSON.stringify({ tickets: [] }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      const tickets = atData.records.map((r) => {
        const f = r.fields || {};
        return {
          id: r.id,
          title: f.Titulo || f.Title || "",
          description: f.Descripcion || f.Description || "",
          priority: f.Prioridad || f.Priority || "Normal",
          submitter: f.Reporta || f.Submitter || "",
          status: f.Estatus || f.Status || "Open",
          created: f.Created || f.Fecha || r.createdTime
        };
      }).filter((t) => t.status !== "Closed" && t.status !== "Resuelto");

      return new Response(JSON.stringify({ tickets: tickets }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // POST - create new ticket
    const body = await req.json();
    const passcode = body.passcode || "";
    const title = body.title || "";
    const description = body.description || "";
    const priority = body.priority || "Normal";
    const submitter = body.submitter || "Otro";

    // Verify passcode
    if (passcode !== "0920") {
      return new Response(JSON.stringify({ error: "Código incorrecto" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!title) {
      return new Response(JSON.stringify({ error: "El título es obligatorio" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Map priority
    const priorityMap = { "Normal": "Normal", "Alta": "High", "Baja": "Low", "🟢 Normal": "Normal", "🔴 Alta": "High", "⚪ Baja": "Low" };
    const mappedPriority = priorityMap[priority] || "Normal";
    const submitterMap = { "Dr. V": "Dr. V", "Asistente": "Asistente", "Otro": "Otro", "👨‍⚕️ Dr. V": "Dr. V", "📋 Asistente": "Asistente", "👤 Otro": "Otro" };
    const mappedSubmitter = submitterMap[submitter] || submitter;

    // Write to Airtable
    const atPayload = {
      records: [{
        fields: {
          Titulo: title,
          Descripcion: description,
          Prioridad: mappedPriority,
          Reporta: mappedSubmitter,
          Estatus: "Open",
          Fecha: new Date().toISOString()
        }
      }]
    };

    const atRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Tech%20Tickets`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + AIRTABLE_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(atPayload)
      }
    );

    const atData = await atRes.json();

    if (atData.error) {
      // Table might not exist - try creating it
      if (atData.error.type === "TABLE_NOT_FOUND") {
        return new Response(JSON.stringify({
          error: "Tabla de tickets no configurada. Contacta al administrador."
        }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: atData.error.message }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Reporte enviado correctamente"
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});