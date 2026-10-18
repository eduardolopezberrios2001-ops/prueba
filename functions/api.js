export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Vincula con la base de datos D1 nombrada en tus bindings de Cloudflare
    const db = env.DB || env['mi-lista-princesa-db'];

    try {
      // 1. Obtener todos los elementos (GET /api/items)
      if (url.pathname === '/api/items' && request.method === 'GET') {
        const { results } = await db.prepare("SELECT * FROM items ORDER BY created DESC").all();
        return Response.json(results.map(r => ({ ...r, bought: Boolean(r.bought) })));
      }

      // 2. Crear un nuevo elemento (POST /api/items)
      if (url.pathname === '/api/items' && request.method === 'POST') {
        const item = await request.json();
        await db.prepare(
          `INSERT INTO items (id, name, category, price, link, description, photo, bought, created) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          item.id, item.name, item.category, item.price || "", 
          item.link || "", item.description || "", item.photo || "", 
          item.bought ? 1 : 0, item.created
        ).run();
        return Response.json({ success: true });
      }

      // 3. Actualizar elemento existente (PUT /api/items/:id)
      if (url.pathname.startsWith('/api/items/') && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const item = await request.json();
        await db.prepare(
          `UPDATE items SET name = ?, category = ?, price = ?, link = ?, description = ?, photo = ?, bought = ? 
           WHERE id = ?`
        ).bind(
          item.name, item.category, item.price || "", 
          item.link || "", item.description || "", item.photo || "", 
          item.bought ? 1 : 0, id
        ).run();
        return Response.json({ success: true });
      }

      // 4. Cambiar estado comprado (PATCH /api/items/:id)
      if (url.pathname.startsWith('/api/items/') && request.method === 'PATCH') {
        const id = url.pathname.split('/').pop();
        const { bought } = await request.json();
        await db.prepare("UPDATE items SET bought = ? WHERE id = ?").bind(bought ? 1 : 0, id).run();
        return Response.json({ success: true });
      }

      // 5. Eliminar elemento (DELETE /api/items/:id)
      if (url.pathname.startsWith('/api/items/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        await db.prepare("DELETE FROM items WHERE id = ?").bind(id).run();
        return Response.json({ success: true });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Servir archivos estáticos de la página si no es ruta de API
    return env.ASSETS.fetch(request);
  }
};
