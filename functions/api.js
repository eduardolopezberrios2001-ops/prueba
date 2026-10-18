export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const db = env.DB || env['mi-lista-princesa-db'];

    try {
      // 1. Obtener todos los elementos de la base de datos
      if (url.pathname === '/api/items' && request.method === 'GET') {
        const { results } = await db.prepare("SELECT * FROM items ORDER BY created DESC").all();
        const formatted = (results || []).map(r => ({
          ...r,
          bought: r.bought === 1 || r.bought === true
        }));
        return new Response(JSON.stringify(formatted), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 2. Guardar un nuevo elemento
      if (url.pathname === '/api/items' && request.method === 'POST') {
        const item = await request.json();
        if (!item.name) {
          return new Response(JSON.stringify({ error: "Falta el nombre" }), { status: 400 });
        }

        await db.prepare(
          `INSERT INTO items (id, name, category, price, link, description, photo, bought, created) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          item.id || String(Date.now()),
          item.name,
          item.category || "Otro",
          item.price || "",
          item.link || "",
          item.description || "",
          item.photo || "",
          item.bought ? 1 : 0,
          item.created || Date.now()
        ).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 3. Actualizar estado comprado (PATCH)
      if (url.pathname.startsWith('/api/items/') && request.method === 'PATCH') {
        const id = url.pathname.split('/').pop();
        const { bought } = await request.json();
        
        await db.prepare("UPDATE items SET bought = ? WHERE id = ?")
          .bind(bought ? 1 : 0, id)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 4. Eliminar un elemento
      if (url.pathname.startsWith('/api/items/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        
        await db.prepare("DELETE FROM items WHERE id = ?")
          .bind(id)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Servir los archivos estáticos si no es una ruta de la API
    return env.ASSETS.fetch(request);
  }
};
