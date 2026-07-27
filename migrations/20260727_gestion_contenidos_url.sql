BEGIN;

-- Sustituye el catálogo de estatus por una bandera simple en ambos recursos.
ALTER TABLE contenidos.contenidos
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE contenidos.enlaces_url
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'contenidos'
      AND table_name = 'enlaces_url'
      AND column_name = 'estatus_id'
  ) AND to_regclass('contenidos.estatus_enlaces') IS NOT NULL THEN
    UPDATE contenidos.enlaces_url AS enlace
    SET activo = LOWER(estatus.estatus) = 'activo'
    FROM contenidos.estatus_enlaces AS estatus
    WHERE estatus.id = enlace.estatus_id;
  END IF;
END $$;

ALTER TABLE contenidos.enlaces_url
  DROP CONSTRAINT IF EXISTS fk_enlaces_url_estatus;

ALTER TABLE contenidos.enlaces_url
  DROP COLUMN IF EXISTS estatus_id;

DROP TABLE IF EXISTS contenidos.estatus_enlaces;

CREATE INDEX IF NOT EXISTS ix_contenidos_seccion_activo
  ON contenidos.contenidos (seccion_id, activo);

CREATE INDEX IF NOT EXISTS ix_enlaces_url_seccion_activo
  ON contenidos.enlaces_url (seccion_id, activo);

INSERT INTO contenidos.secciones (seccion, descripcion) VALUES
  ('Empresa', 'Textos administrables de la sección Empresa del sitio público.'),
  ('Soluciones', 'Textos administrables de la sección Soluciones del sitio público.'),
  ('General', 'Enlaces generales reutilizados en distintas secciones del sitio público.'),
  ('Integradores', 'Repositorios y recursos de integración publicados en el sitio.')
ON CONFLICT (seccion) DO UPDATE
SET descripcion = EXCLUDED.descripcion;

-- Enlaces generales que actualmente usa el sitio.
INSERT INTO contenidos.enlaces_url (clave, url, seccion_id, activo)
SELECT datos.clave, datos.url, seccion.id, TRUE
FROM (
  VALUES
    ('general.dashboard_registro', 'http://grupotum.com:9020/registro'),
    ('general.dashboard_acceso', 'http://grupotum.com:9020/acceso')
) AS datos(clave, url)
CROSS JOIN contenidos.secciones AS seccion
WHERE LOWER(seccion.seccion) = 'general'
ON CONFLICT (clave) DO NOTHING;

-- Repositorios que actualmente aparecen en Integradores.
INSERT INTO contenidos.enlaces_url (clave, url, seccion_id, activo)
SELECT datos.clave, datos.url, seccion.id, TRUE
FROM (
  VALUES
    ('integradores.net', 'https://github.com/TimboxIntegracion/timbox-.net'),
    ('integradores.java', 'https://github.com/TimboxIntegracion/timbox-java'),
    ('integradores.php', 'https://github.com/TimboxIntegracion/timbox-php'),
    ('integradores.python', 'https://github.com/TimboxIntegracion/timbox-python'),
    ('integradores.ruby', 'https://github.com/TimboxIntegracion/timbox-ruby'),
    ('integradores.web_dev', 'https://github.com/TimboxIntegracion/timbox-webdev'),
    ('integradores.vfoxpro', 'https://github.com/TimboxIntegracion/timbox-vfoxpro'),
    ('integradores.vb', 'https://github.com/TimboxIntegracion/timbox-vb'),
    ('integradores.nodejs', 'https://github.com/TimboxIntegracion/NodeJS-WebServiceAPI'),
    ('integradores.laravel', 'https://github.com/TimboxIntegracion/Laravel-WebServiceAPI'),
    ('integradores.visual_csharp_dll', 'https://github.com/TimboxIntegracion/Ejemplo-CSharp-DLL'),
    ('integradores.visual_basic_dll', 'https://github.com/TimboxIntegracion/Ejemplo-VB-DLL'),
    ('integradores.foxpro_dll', 'https://github.com/TimboxIntegracion/Ejemplo-VFP-DLL'),
    ('integradores.delphi_dll', 'https://github.com/TimboxIntegracion/Ejemplo-Delphi-DLL')
) AS datos(clave, url)
CROSS JOIN contenidos.secciones AS seccion
WHERE LOWER(seccion.seccion) = 'integradores'
ON CONFLICT (clave) DO NOTHING;

COMMIT;
