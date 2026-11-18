-- Activa Row Level Security (RLS) en todas las tablas, sin políticas.
-- Supabase expone el esquema "public" por su API REST (PostgREST) con los roles
-- "anon" y "authenticated"; con RLS activo y sin políticas esos roles no pueden
-- leer ni escribir nada. La API de FoodSave se conecta con el rol de la cadena
-- de conexión (propietario de las tablas, con BYPASSRLS), así que no se ve afectada.

ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comercio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sede" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
