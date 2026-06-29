/**
 * PepBiohacking Inventory Webhook
 * ================================
 * 
 * ONE webhook does TWO things:
 *   GET  → returns inventory with prices + summary
 *   POST → receives price change requests → writes to Fix Tickets tab
 *
 * DEPLOY: Extensions → Apps Script → Ctrl+A, Ctrl+V → Deploy → New deployment
 *         Type: Web app → Execute as: Me → Who has access: Anyone
 *         Copy the URL → paste into inventario.html
 */

// ── CONFIG ──
const SPREADSHEET_ID = "1OL2brXvaz7JH3uIXnwviUWuQjsv1XDCq";
const INVENTORY_SHEET = "Sheet1";       // Main inventory tab
const TICKETS_SHEET   = "Fix Tickets";  // Will be created if missing
const PASSCODE        = "PEPBIO2026";

// ── CORS headers for the portal page ──
function doGet(e) {
  return handleRequest("GET", e);
}

function doPost(e) {
  return handleRequest("POST", e);
}

function handleRequest(method, e) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  
  try {
    if (method === "GET") return respond(200, getInventory(), headers);
    if (method === "POST") return respond(200, submitTicket(e), headers);
  } catch (err) {
    return respond(500, { error: err.message }, headers);
  }
}

// ── GET: Return inventory with prices ──
function getInventory() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(INVENTORY_SHEET);
  const rows = sheet.getDataRange().getValues();
  
  if (rows.length < 2) return { inventory: [], summary: emptySummary(), updated: new Date().toISOString() };
  
  const headers = rows[0].map(h => String(h).trim());
  const data = rows.slice(1);
  
  // Map columns by header name (handles \n in headers like "Stock\nActual")
  const col = (name) => {
    const idx = headers.findIndex(h => h.replace(/\n/g, " ").trim() === name || h === name);
    return idx >= 0 ? idx : -1;
  };
  
  const cProduct  = col("Péptido");
  const cStock    = col("Stock Actual");
  const cEstado   = col("Estado");
  const cPrecio   = col("Precio");
  const cSKU      = col("#");
  
  // Product SKU mapping for products without explicit SKU column
  // Using the internal mapping from the checkout catalog
  const SKU_MAP = {
    "AGUA BACTERIOSTATICA 10ml":       "AGUA-10ML",
    "AGUA BACTERIOSTATICA 3ml":        "AGUA-3ML",
    "BPC-157/TB-500 10mg/10mg":        "BPC-TB-10",
    "BPC-157/TB-500 5mg/5mg":          "BPC-TB-5",
    "CJC-1295/IPAMORELIN 5mg/5mg":     "CJC-IPA",
    "DSIP 10mg":                       "DSIP-10",
    "GHK-Cu 100mg":                    "GHK-CU-100",
    "GLP-1(48mg)":                     "GLP1-48",
    "IGF-1 LR3 1mg":                   "IGF1-LR3",
    "MELANOTAN II 10mg":               "MT2-10",
    "MOTS-C 10mg":                     "MOTS-C-10",
    "PT-141 BREMELANOTIDE 10mg":       "PT141-10",
    "SELANK 15mg":                     "SELANK-15",
    "SEMAX 15mg":                      "SEMAX-15",
    "SS-31 50mg":                      "SS31-50",
    "TB-500 5mg":                      "TB500-5",
    "THYMOSIN ALPHA-1 10mg":           "THYM-ALPHA-10",
    "BPC-157 10mg":                    "BPC-10",
    "BPC-157 5mg":                     "BPC-5",
    "CJC-1295 5mg":                    "CJC-5",
    "DAC GLP-1 3.5mg":                 "DAC-GLP1",
    "GHRP-2 5mg":                      "GHRP2-5",
    "GHRP-6 5mg":                      "GHRP6-5",
    "HEPENDA 15mg":                    "HEPENDA-15",
    "IGF-1 DES 1mg":                   "IGF-DES-1",
    "IPAMORELIN 5mg":                  "IPA-5",
    "TESAMORELIN 5mg":                 "TESA-5",
  };
  
  let inventory = [];
  let totalUnits = 0;
  let inStock = 0, lowStock = 0, outOfStock = 0;
  
  data.forEach((row, i) => {
    const productName = String(row[cProduct] || "").trim();
    if (!productName) return;
    
    const stock = parseInt(row[cStock]) || 0;
    const statusRaw = String(row[cEstado] || "").trim();
    const priceRaw = cProduct >= 0 ? (row[cPrecio] || 0) : 0;
    const price = parseFloat(priceRaw) || 0;
    const sku = SKU_MAP[productName] || `SKU-${i + 1}`;
    
    // Normalize status
    let status = "Out of Stock";
    if (statusRaw.includes("OK") || statusRaw.includes("🟢")) status = "In Stock";
    else if (stock > 0 && stock <= 10) status = "Low Stock";
    else if (stock > 10) status = "In Stock";
    
    inventory.push({
      sku: sku,
      product: productName,
      stock: stock,
      status: status,
      lowAlert: 10,
      price: price
    });
    
    totalUnits += stock;
    if (status === "In Stock") inStock++;
    else if (status === "Low Stock") lowStock++;
    else outOfStock++;
  });
  
  return {
    inventory: inventory,
    summary: {
      inStock: inStock,
      lowStock: lowStock,
      outOfStock: outOfStock,
      totalSKUs: inventory.length,
      totalUnits: totalUnits
    },
    updated: new Date().toISOString()
  };
}

function emptySummary() {
  return { inStock: 0, lowStock: 0, outOfStock: 0, totalSKUs: 0, totalUnits: 0 };
}

// ── POST: Receive price change ticket ──
function submitTicket(e) {
  const body = e.postData ? JSON.parse(e.postData.contents) : {};
  
  // Validate passcode
  if (body.passcode !== PASSCODE) {
    return { success: false, error: "Código incorrecto" };
  }
  
  const product  = (body.product || "").trim();
  const newPrice = parseFloat(body.newPrice);
  const note     = (body.note || "").trim();
  const submitter = body.submitter || "Dr. V";
  
  if (!product) return { success: false, error: "Producto es obligatorio" };
  if (isNaN(newPrice) || newPrice <= 0) return { success: false, error: "Precio inválido" };
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Create Fix Tickets tab if it doesn't exist
  let ticketSheet = ss.getSheetByName(TICKETS_SHEET);
  if (!ticketSheet) {
    ticketSheet = ss.insertSheet(TICKETS_SHEET);
    ticketSheet.appendRow(["Timestamp", "Producto", "Precio Actual", "Precio Solicitado", "Nota", "Solicitado por", "Estado"]);
    ticketSheet.setFrozenRows(1);
    ticketSheet.getRange("1:1").setFontWeight("bold");
  }
  
  // Find current price from inventory
  const invSheet = ss.getSheetByName(INVENTORY_SHEET);
  const invRows = invSheet.getDataRange().getValues();
  const invHeaders = invRows[0].map(h => String(h).trim().replace(/\n/g, " "));
  const precioCol = invHeaders.findIndex(h => h === "Precio");
  const prodCol = invHeaders.findIndex(h => h.includes("Péptido"));
  
  let currentPrice = "—";
  if (prodCol >= 0 && precioCol >= 0) {
    for (let r = 1; r < invRows.length; r++) {
      const name = String(invRows[r][prodCol] || "").trim();
      if (name === product) {
        currentPrice = invRows[r][precioCol] || "—";
        break;
      }
    }
  }
  
  // Append ticket
  ticketSheet.appendRow([
    new Date().toISOString(),
    product,
    currentPrice,
    newPrice,
    note || "—",
    submitter,
    "Pendiente"
  ]);
  
  return {
    success: true,
    message: `✅ Solicitud enviada — ${product} → $${newPrice.toLocaleString("es-MX")} MXN`
  };
}

// ── CORS preflight ──
function doOptions(e) {
  return ContentService
    .createTextOutput("OK")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
}

function respond(status, data, headers) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}