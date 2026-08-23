const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function responder(statusCode, cuerpo) {
  return {
    statusCode,
    headers: { ...CORS, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo)
  };
}

function urlBase(event) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const h = event.headers || {};
  if (h.origin && !h.origin.includes("localhost")) return h.origin;
  if (h.referer) {
    try {
      const origen = new URL(h.referer).origin;
      if (!origen.includes("localhost")) return origen;
    } catch (e) {}
  }
  const proto = h["x-forwarded-proto"] || "http";
  const host = h["x-forwarded-host"] || h.host || "localhost:8888";
  return proto + "://" + host;
}

exports.handler = async event => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return responder(405, { error: "Metodo no permitido." });

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return responder(501, { error: "MercadoPago sin configurar." });

  let datos = null;
  try { datos = JSON.parse(event.body || "{}"); } catch (e) {}

  const cantidad = parseInt(datos && datos.cantidad, 10);
  const precioUnitario = Number(datos && datos.precioUnitario);
  if (!Number.isInteger(cantidad) || cantidad < 1 || !isFinite(precioUnitario) || precioUnitario < 1) {
    return responder(400, { error: "Datos de compra invalidos." });
  }

  const base = urlBase(event);
  const preferencia = {
    items: [{
      title: "Entrada Eurovision",
      quantity: cantidad,
      unit_price: precioUnitario,
      currency_id: "ARS"
    }],
    back_urls: {
      success: base + "/comprar.html?pago=exito",
      pending: base + "/comprar.html?pago=pendiente",
      failure: base + "/comprar.html?pago=fallo"
    },
    auto_return: "approved",
    statement_descriptor: "EUROVISION",
    external_reference: "compra-" + Date.now()
  };

  let respuesta;
  try {
    respuesta = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferencia)
    });
  } catch (e) {
    return responder(502, { error: "No se pudo contactar a MercadoPago." });
  }

  if (!respuesta.ok) {
    let detalle = "";
    try { detalle = await respuesta.text(); } catch (e) {}
    return responder(502, { error: "MercadoPago rechazo la peticion.", detalle });
  }

  let data;
  try { data = await respuesta.json(); } catch (e) {
    return responder(502, { error: "Respuesta inesperada de MercadoPago." });
  }

  return responder(200, { initPoint: data.init_point, id: data.id });
};
