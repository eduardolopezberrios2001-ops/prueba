export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    if (method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM wishlist_items ORDER BY created DESC").all();
      const items = (results || []).map(item => ({
        ...item,
        bought: Boolean(item.bought)
      }));
      return new Response(JSON.stringify(items), { headers });
    }

    if (method === "POST") {
      const body = await request.json();
      await env.DB.prepare(
        "INSERT INTO wishlist_items (id, name, category, price, link, description, photo, bought, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        body.id,
        body.name,
        body.category || 'Otro caprichito',
        body.price || '',
        body.link || '',
        body.description || '',
        body.photo || '',
        body.bought ? 1 : 0,
        body.created || Date.now()
      ).run();

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (method === "PUT") {
      const body = await request.json();
      await env.DB.prepare(
        "UPDATE wishlist_items SET name = ?, category = ?, price = ?, link = ?, description = ?, photo = ?, bought = ? WHERE id = ?"
      ).bind(
        body.name,
        body.category || 'Otro caprichito',
        body.price || '',
        body.link || '',
        body.description || '',
        body.photo || '',
        body.bought ? 1 : 0,
        body.id
      ).run();

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (id) {
        await env.DB.prepare("DELETE FROM wishlist_items WHERE id = ?").bind(id).run();
      } else {
        await env.DB.prepare("DELETE FROM wishlist_items").run();
      }
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
