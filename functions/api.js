export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const db = env.DB || env['mi-lista-princesa-db'];

    try {
      // Obtener todos los elementos
      if (url.pathname === '/api/items' && request.method === 'GET') {
        const { results } = await db.prepare("SELECT * FROM items ORDER BY created DESC").all();
        return Response.json(results.map(r => ({ ...r, bought: Boolean(r.bought) })));
      }

      // Guardar un nuevo elemento (POST)
      if (url.pathname === '/api/items' && request.method === 'POST') {
        const item = await request.json();
        await db.prepare(
          `INSERT INTO items (id, name, category, price, link, description, photo, bought, created) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          item.id, 
          item.name, 
          item.category, 
          item.price || "", 
          item.link || "", 
          item.description || "", 
          item.photo || "", 
          item.bought ? 1 : 0, 
          item.created
        ).run();
        
        return Response.json({ success: true });
      }

      // Actualizar elemento (PUT)
      if (url.pathname.startsWith('/api/items/') && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        const item = await request.json();
        await db.prepare(
          `UPDATE items SET name = ?, category = ?, price = ?, link = ?, description = ?, photo = ?, bought = ? 
           WHERE id = ?`
        ).bind(
          item.name, 
          item.category, 
          item.price || "", 
          item.link || "", 
          item.description || "", 
          item.photo || "", 
          item.bought ? 1 : 0, 
          id
        ).run();
        
        return Response.json({ success: true });
      }

      // Cambiar estado comprado (PATCH)
      if (url.pathname.startsWith('/api/items/') && request.method === 'PATCH') {
        const id = url.pathname.split('/').pop();
        const { bought } = await request.json();
        await db.prepare("UPDATE items SET bought = ? WHERE id = ?").bind(bought ? 1 : 0, id).run();
        return Response.json({ success: true });
      }

      // Eliminar (DELETE)
      if (url.pathname.startsWith('/api/items/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        await db.prepare("DELETE FROM items WHERE id = ?").bind(id).run();
        return Response.json({ success: true });
      }
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }

    return env.ASSETS.fetch(request);
  }
};
