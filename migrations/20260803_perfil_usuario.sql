BEGIN;

ALTER TABLE sys.usuarios
ADD COLUMN IF NOT EXISTS foto_perfil TEXT;

COMMENT ON COLUMN sys.usuarios.foto_perfil IS
'Nombre del archivo de la fotografía de perfil almacenada fuera de la base de datos.';

COMMIT;
