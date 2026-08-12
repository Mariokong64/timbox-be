CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- ESQUEMAS
-- =========================

CREATE SCHEMA IF NOT EXISTS sys;
CREATE SCHEMA IF NOT EXISTS chatbot;
CREATE SCHEMA IF NOT EXISTS contacto;
CREATE SCHEMA IF NOT EXISTS contenidos;
CREATE SCHEMA IF NOT EXISTS cfdi;

-- =========================
-- SYS
-- =========================

CREATE TABLE IF NOT EXISTS sys.usuarios
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    usuario character varying(100) COLLATE pg_catalog."default" NOT NULL,
    nombre character varying(150) COLLATE pg_catalog."default" NOT NULL,
    contrasena text COLLATE pg_catalog."default" NOT NULL,
    correo character varying(150) COLLATE pg_catalog."default" NOT NULL,
    fecha_registro timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_por_id uuid,
    modificado timestamp without time zone,
    modificado_por_id uuid,
    foto_perfil text COLLATE pg_catalog."default",
    CONSTRAINT usuarios_pkey PRIMARY KEY (id),
    CONSTRAINT usuarios_correo_key UNIQUE (correo),
    CONSTRAINT usuarios_usuario_key UNIQUE (usuario),
    CONSTRAINT fk_usuarios_creado_por FOREIGN KEY (creado_por_id)
        REFERENCES sys.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_usuarios_modificado_por FOREIGN KEY (modificado_por_id)
        REFERENCES sys.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL
)

-- =========================
-- CONTENIDOS
-- =========================

CREATE TABLE IF NOT EXISTS contenidos.secciones
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    seccion character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descripcion text COLLATE pg_catalog."default",
    CONSTRAINT secciones_pkey PRIMARY KEY (id),
    CONSTRAINT secciones_seccion_key UNIQUE (seccion)
)

CREATE TABLE IF NOT EXISTS contenidos.enlaces_url
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    clave character varying(100) COLLATE pg_catalog."default" NOT NULL,
    url text COLLATE pg_catalog."default" NOT NULL,
    seccion_id uuid NOT NULL,
    fecha_actualizacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo boolean NOT NULL DEFAULT true,
    CONSTRAINT enlaces_url_pkey PRIMARY KEY (id),
    CONSTRAINT enlaces_url_clave_key UNIQUE (clave),
    CONSTRAINT fk_enlaces_url_seccion FOREIGN KEY (seccion_id)
        REFERENCES contenidos.secciones (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)

CREATE INDEX IF NOT EXISTS ix_enlaces_url_seccion_activo
    ON contenidos.enlaces_url USING btree
    (seccion_id ASC NULLS LAST, activo ASC NULLS LAST)
    TABLESPACE pg_default;



-- =========================
-- CHATBOT
-- =========================

CREATE TABLE IF NOT EXISTS chatbot.estatus_conversaciones
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    estatus character varying(50) COLLATE pg_catalog."default" NOT NULL,
    descripcion text COLLATE pg_catalog."default",
    CONSTRAINT estatus_conversaciones_pkey PRIMARY KEY (id),
    CONSTRAINT estatus_conversaciones_estatus_key UNIQUE (estatus)
)

CREATE TABLE IF NOT EXISTS chatbot.emisores
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    emisor character varying(50) COLLATE pg_catalog."default" NOT NULL,
    descripcion text COLLATE pg_catalog."default",
    CONSTRAINT emisores_pkey PRIMARY KEY (id),
    CONSTRAINT emisores_emisor_key UNIQUE (emisor)
)

CREATE TABLE IF NOT EXISTS chatbot.conversaciones
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    fecha_inicio timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin timestamp without time zone,
    estatus_id uuid NOT NULL,
    sesion_visitante_id uuid,
    fecha_ultima_actividad timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT conversaciones_pkey PRIMARY KEY (id),
    CONSTRAINT fk_conversaciones_estatus FOREIGN KEY (estatus_id)
        REFERENCES chatbot.estatus_conversaciones (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_conversaciones_sesion_visitante FOREIGN KEY (sesion_visitante_id)
        REFERENCES chatbot.sesiones_visitantes (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)

CREATE INDEX IF NOT EXISTS ix_conversaciones_actividad
    ON chatbot.conversaciones USING btree
    (fecha_fin ASC NULLS LAST, fecha_ultima_actividad DESC NULLS FIRST)
    TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS chatbot.mensajes
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    contenido text COLLATE pg_catalog."default" NOT NULL,
    emisor_id uuid NOT NULL,
    fecha_registro timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    conversacion_id uuid NOT NULL,
    usuario_id uuid,
    CONSTRAINT mensajes_pkey PRIMARY KEY (id),
    CONSTRAINT fk_mensajes_conversacion FOREIGN KEY (conversacion_id)
        REFERENCES chatbot.conversaciones (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_mensajes_emisor FOREIGN KEY (emisor_id)
        REFERENCES chatbot.emisores (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_mensajes_usuario FOREIGN KEY (usuario_id)
        REFERENCES sys.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL
)

CREATE INDEX IF NOT EXISTS ix_mensajes_conversacion_fecha
    ON chatbot.mensajes USING btree
    (conversacion_id ASC NULLS LAST, fecha_registro ASC NULLS LAST, id ASC NULLS LAST)
    TABLESPACE pg_default;


CREATE TABLE IF NOT EXISTS chatbot.sesiones_visitantes
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    token_hash character(64) COLLATE pg_catalog."default" NOT NULL,
    nombre character varying(150) COLLATE pg_catalog."default" NOT NULL,
    correo character varying(150) COLLATE pg_catalog."default" NOT NULL,
    telefono character varying(20) COLLATE pg_catalog."default",
    fecha_creacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion timestamp without time zone NOT NULL,
    ultima_actividad timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sesiones_visitantes_pkey PRIMARY KEY (id),
    CONSTRAINT sesiones_visitantes_token_hash_key UNIQUE (token_hash)
)

CREATE INDEX IF NOT EXISTS ix_sesiones_visitantes_token
    ON chatbot.sesiones_visitantes USING btree
    (token_hash COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- =========================
-- CONTACTO
-- =========================

CREATE TABLE IF NOT EXISTS contacto.estatus_solicitudes
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    estatus character varying(50) COLLATE pg_catalog."default" NOT NULL,
    descripcion text COLLATE pg_catalog."default",
    CONSTRAINT estatus_solicitudes_pkey PRIMARY KEY (id),
    CONSTRAINT estatus_solicitudes_estatus_key UNIQUE (estatus)
)

CREATE TABLE IF NOT EXISTS contacto.origenes
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    origen character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descripcion text COLLATE pg_catalog."default",
    CONSTRAINT origenes_pkey PRIMARY KEY (id),
    CONSTRAINT origenes_origen_key UNIQUE (origen)
)

CREATE TABLE IF NOT EXISTS contacto.solicitudes_contacto
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre character varying(150) COLLATE pg_catalog."default" NOT NULL,
    correo character varying(150) COLLATE pg_catalog."default" NOT NULL,
    telefono character varying(20) COLLATE pg_catalog."default",
    rfc character varying(13) COLLATE pg_catalog."default",
    mensaje text COLLATE pg_catalog."default",
    conversacion_id uuid,
    estatus_id uuid NOT NULL,
    origen_id uuid NOT NULL,
    fecha_registro timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT solicitudes_contacto_pkey PRIMARY KEY (id),
    CONSTRAINT fk_solicitudes_contacto_estatus FOREIGN KEY (estatus_id)
        REFERENCES contacto.estatus_solicitudes (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_solicitudes_contacto_origen FOREIGN KEY (origen_id)
        REFERENCES contacto.origenes (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_solicitudes_contacto_conversacion FOREIGN KEY (conversacion_id)
        REFERENCES chatbot.conversaciones (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)

CREATE INDEX IF NOT EXISTS ix_solicitudes_contacto_origen_estatus_fecha
    ON contacto.solicitudes_contacto USING btree
    (origen_id ASC NULLS LAST, estatus_id ASC NULLS LAST, fecha_registro ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS ix_solicitudes_contacto_conversacion
    ON contacto.solicitudes_contacto USING btree
    (conversacion_id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS contacto.atenciones
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL,
    solicitud_id uuid NOT NULL,
    detalles text COLLATE pg_catalog."default",
    fecha_atencion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT atenciones_pkey PRIMARY KEY (id),
    CONSTRAINT fk_atenciones_solicitud FOREIGN KEY (solicitud_id)
        REFERENCES contacto.solicitudes_contacto (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_atenciones_usuario FOREIGN KEY (usuario_id)
        REFERENCES sys.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)

CREATE INDEX IF NOT EXISTS ix_atenciones_solicitud_fecha
    ON contacto.atenciones USING btree
    (solicitud_id ASC NULLS LAST, fecha_atencion ASC NULLS LAST)
    TABLESPACE pg_default;

-- Estas tablas son para una funcionalidad que el cliente no determina si se agrega o no

CREATE TABLE IF NOT EXISTS contacto.destinatarios_notificacion
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    correo text COLLATE pg_catalog."default" NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    creado timestamp without time zone NOT NULL DEFAULT now(),
    creado_por_id uuid NOT NULL,
    modificado timestamp without time zone,
    modificado_por_id uuid,
    CONSTRAINT destinatarios_notificacion_pkey PRIMARY KEY (id),
    CONSTRAINT fk_destinatarios_notificacion_creado_por FOREIGN KEY (creado_por_id)
        REFERENCES sys.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_destinatarios_notificacion_modificado_por FOREIGN KEY (modificado_por_id)
        REFERENCES sys.usuarios (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT ck_destinatarios_notificacion_correo CHECK (correo = btrim(correo) AND correo ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'::text)
)

CREATE UNIQUE INDEX IF NOT EXISTS ux_destinatarios_notificacion_correo
    ON contacto.destinatarios_notificacion USING btree
    (lower(correo) COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS contacto.estatus_envios_correo
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    estatus character varying(50) COLLATE pg_catalog."default" NOT NULL,
    descripcion text COLLATE pg_catalog."default",
    CONSTRAINT estatus_envios_correo_pkey PRIMARY KEY (id),
    CONSTRAINT estatus_envios_correo_estatus_key UNIQUE (estatus)
)

CREATE TABLE IF NOT EXISTS contacto.envios_solicitudes_contacto
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    solicitud_contacto_id uuid NOT NULL,
    destinatario_notificacion_id uuid,
    correo_destinatario text COLLATE pg_catalog."default" NOT NULL,
    estatus_envio_id uuid NOT NULL,
    intentos integer NOT NULL DEFAULT 0,
    proximo_intento timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_intento timestamp without time zone,
    fecha_envio timestamp without time zone,
    mensaje_id text COLLATE pg_catalog."default",
    ultimo_error text COLLATE pg_catalog."default",
    creado timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificado timestamp without time zone,
    CONSTRAINT envios_solicitudes_contacto_pkey PRIMARY KEY (id),
    CONSTRAINT fk_envios_solicitudes_contacto_destinatario FOREIGN KEY (destinatario_notificacion_id)
        REFERENCES contacto.destinatarios_notificacion (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_envios_solicitudes_contacto_estatus FOREIGN KEY (estatus_envio_id)
        REFERENCES contacto.estatus_envios_correo (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_envios_solicitudes_contacto_solicitud FOREIGN KEY (solicitud_contacto_id)
        REFERENCES contacto.solicitudes_contacto (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT ck_envios_solicitudes_contacto_intentos CHECK (intentos >= 0)
)

CREATE INDEX IF NOT EXISTS ix_envios_solicitudes_contacto_procesamiento
    ON contacto.envios_solicitudes_contacto USING btree
    (estatus_envio_id ASC NULLS LAST, proximo_intento ASC NULLS LAST, creado ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS ux_envios_solicitudes_contacto_destinatario
    ON contacto.envios_solicitudes_contacto USING btree
    (solicitud_contacto_id ASC NULLS LAST, lower(correo_destinatario) COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Fin de las tablas que son para una funcionalidad que el cliente no determina si se agrega o no

-- =========================
-- CFDI / VALIDACIONES
-- =========================

CREATE TABLE IF NOT EXISTS cfdi.resultados_validaciones
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    resultado character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descripcion text COLLATE pg_catalog."default",
    CONSTRAINT resultados_validaciones_pkey PRIMARY KEY (id),
    CONSTRAINT resultados_validaciones_resultado_key UNIQUE (resultado)
)

CREATE TABLE IF NOT EXISTS cfdi.validaciones_cfdi
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    resultado_id uuid NOT NULL,
    rfc_emisor character varying(13) COLLATE pg_catalog."default",
    rfc_receptor character varying(13) COLLATE pg_catalog."default",
    total numeric(14,2),
    uuid_cfdi character varying(36) COLLATE pg_catalog."default",
    nombre_archivo character varying(255) COLLATE pg_catalog."default",
    fecha_validacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT validaciones_cfdi_pkey PRIMARY KEY (id),
    CONSTRAINT fk_validaciones_cfdi_resultado FOREIGN KEY (resultado_id)
        REFERENCES cfdi.resultados_validaciones (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)

CREATE INDEX IF NOT EXISTS ix_validaciones_cfdi_resultado_fecha
    ON cfdi.validaciones_cfdi USING btree
    (resultado_id ASC NULLS LAST, fecha_validacion ASC NULLS LAST)
    TABLESPACE pg_default;


-- =========================
-- SEMILLAS CONTENIDOS
-- =========================

INSERT INTO contenidos.secciones (id, seccion, descripcion)
VALUES
    ('30c919d7-7593-4daa-a5f1-dc9c38d75726', 'Inicio', 'Contenido mostrado en la página principal del sitio público.'),
    ('8b42147a-0e8f-49b6-b0b2-9ec157929c66', 'Integración tecnológica', 'Contenido relacionado con la sección de la integración tecnológica'),
    ('268642b3-47f7-45ca-a434-f1cf4c1dccfb', 'Soporte y documentación', 'Contenido mostrado en la sección de soporte y documentación'),
    ('63ba26f5-2280-4e02-916e-e8c8a2c1bce3', 'Políticas y términos legales', 'Contenido mostrado en la sección de las políticas y términos legales'),
    ('5c4bfa40-3f0b-47b6-a935-ffaf794c4f3e', 'Preguntas frecuantes FAQ', 'Contenido de la parte de las preguntas frecuentes'),
    ('b502ae6c-c56d-4d59-931d-b9f280e231a9', 'Empresa', 'Textos administrables de la sección Empresa del sitio público.'),
    ('6407d5ce-e8ec-41dd-943c-aa08baf9143a', 'Soluciones', 'Textos administrables de la sección Soluciones del sitio público.'),
    ('8988d74a-55e4-45c4-8da4-58ea4c1b86f6', 'General', 'Enlaces generales reutilizados en distintas secciones del sitio público.'),
    ('5796e4d5-ab3b-4743-96e8-1ccebf774b86', 'Integradores', 'Repositorios y recursos de integración publicados en el sitio.')
ON CONFLICT DO NOTHING;

INSERT INTO contenidos.enlaces_url (id, clave, url, seccion_id, fecha_actualizacion, activo)
VALUES
    ('d5457a75-eda7-41fd-b224-a0a9ffa9f7d2', 'integradores.net', 'https://github.com/TimboxIntegracion/timbox-.net', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('becc104b-12eb-4d13-a0af-b3fa1b2ed362', 'integradores.java', 'https://github.com/TimboxIntegracion/timbox-java', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('0be2c7fa-770c-4fa7-9105-87d93834bb56', 'integradores.php', 'https://github.com/TimboxIntegracion/timbox-php', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('0f6adf86-a6f8-45c4-b407-ef5f05ed5baf', 'integradores.python', 'https://github.com/TimboxIntegracion/timbox-python', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('c136c1c3-08ba-41bf-9bf9-a2ec33307295', 'integradores.ruby', 'https://github.com/TimboxIntegracion/timbox-ruby', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('dff34fb8-96de-4cb0-8056-11b57cfb10bd', 'integradores.web_dev', 'https://github.com/TimboxIntegracion/timbox-webdev', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('2dfefe0f-c6e8-46b3-b975-02a3031ffc1c', 'integradores.vfoxpro', 'https://github.com/TimboxIntegracion/timbox-vfoxpro', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('047c2b61-ffe0-4068-a1f1-ea277d5bd498', 'integradores.vb', 'https://github.com/TimboxIntegracion/timbox-vb', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('3d99cc5a-6abc-4a3c-86e0-46e15973a73b', 'integradores.nodejs', 'https://github.com/TimboxIntegracion/NodeJS-WebServiceAPI', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('ea525a97-3876-4624-933f-c64cee6ec194', 'integradores.laravel', 'https://github.com/TimboxIntegracion/Laravel-WebServiceAPI', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('d16e3669-9974-48b7-8d7a-c324af266198', 'integradores.visual_csharp_dll', 'https://github.com/TimboxIntegracion/Ejemplo-CSharp-DLL', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('4ba4e56d-1fad-4ce3-9e4c-5de2f1d25f75', 'integradores.visual_basic_dll', 'https://github.com/TimboxIntegracion/Ejemplo-VB-DLL', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('38e82a19-0856-413c-8cdd-54c0802cdb73', 'integradores.foxpro_dll', 'https://github.com/TimboxIntegracion/Ejemplo-VFP-DLL', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('bf0be16f-3751-4386-9d6c-d85344984012', 'integradores.delphi_dll', 'https://github.com/TimboxIntegracion/Ejemplo-Delphi-DLL', '5796e4d5-ab3b-4743-96e8-1ccebf774b86', '2026-07-27 23:38:12.420711', true),
    ('7c70ed75-0ba2-48a7-bb82-e0297a5b9d7f', 'timbox_linkedin', 'https://www.linkedin.com/company/timbox/', '8988d74a-55e4-45c4-8da4-58ea4c1b86f6', '2026-08-05 22:28:29.237833', true),
    ('7d3c996a-da0d-4bb8-937d-c0a5f6231076', 'timbox_facebook', 'https://www.facebook.com/TimboxPAC/', '8988d74a-55e4-45c4-8da4-58ea4c1b86f6', '2026-08-05 22:28:55.878881', true),
    ('05825c06-19e8-4232-8a2d-fd036fc8b53e', 'timbox_dashboard_registro', 'https://dashboard.timbox.com.mx/registro', '8988d74a-55e4-45c4-8da4-58ea4c1b86f6', '2026-08-05 23:30:57.007522', true),
    ('8b205a05-b6b6-440a-966b-70ddde770669', 'timbox_dashboard_acceso', 'https://dashboard.timbox.com.mx/acceso', '8988d74a-55e4-45c4-8da4-58ea4c1b86f6', '2026-08-05 23:31:19.185976', true),
    ('b5c5431f-3f43-40ad-80fb-40cc983030e2', 'aplicacion_gratuita', 'https://appgratis.timbox.com.mx/acceso', '8988d74a-55e4-45c4-8da4-58ea4c1b86f6', '2026-08-06 18:21:57.173966', true)
ON CONFLICT DO NOTHING;


-- =========================
-- SEMILLAS CHATBOT
-- =========================

INSERT INTO chatbot.estatus_conversaciones (id, estatus, descripcion)
VALUES
    ('0d137397-9d3b-4190-8ec3-ee9626b54b8d', 'Abierta', 'La conversación se encuentra activa.'),
    ('51ffaff0-ccfb-46fd-ae58-b9dcd4d29422', 'Finalizada', 'La conversación fue finalizada.'),
    ('700e0d98-3c56-4762-a44e-bf082f7b7338', 'Derivada a contacto', 'La conversación generó una solicitud de contacto.')
ON CONFLICT DO NOTHING;

INSERT INTO chatbot.emisores (id, emisor, descripcion)
VALUES
    ('5f5d59ab-478f-491c-87a1-4fc768b8d724', 'Usuario', 'Mensaje enviado por el visitante del sitio público.'),
    ('b7f2765b-f3a0-48cc-8b2b-301bbdf76256', 'Chatbot', 'Mensaje generado automáticamente por el chatbot.'),
    ('5d51519c-55ae-4246-872c-61c1c87b5239', 'Sistema', 'Mensaje generado por reglas internas del sistema.'),
    ('ffb00f60-0e74-4ad6-9061-5aabbb91d1a5', 'Administrador', 'Mensaje generado por un administrador del sistema.')
ON CONFLICT DO NOTHING;


-- =========================
-- SEMILLAS CONTACTO
-- =========================

INSERT INTO contacto.estatus_solicitudes (id, estatus, descripcion)
VALUES
    ('1f5d2af8-a66a-44ee-9589-2bf18d6d18b6', 'Nueva', 'Solicitud registrada y pendiente de atención.'),
    ('38763fc9-d9ed-4e5b-8ddf-63f6db1afed4', 'En atención', 'Solicitud revisada por un usuario del sistema.'),
    ('91f5cc7a-67ba-443c-8250-084668a21135', 'Atendida', 'Solicitud atendida correctamente.'),
    ('0833bc74-295d-4493-b6ab-9fd867ea496a', 'Descartada', 'Solicitud descartada por no proceder o por información insuficiente.')
ON CONFLICT DO NOTHING;

INSERT INTO contacto.origenes (id, origen, descripcion)
VALUES
    ('dad9f37d-529f-4b7a-afec-78b546ded058', 'Formulario público', 'Solicitud generada desde el formulario de contacto del sitio público.'),
    ('20832c8a-85d6-4679-9d95-c309a2333741', 'Chatbot', 'Solicitud generada durante una conversación con el chatbot.')
ON CONFLICT DO NOTHING;

INSERT INTO contacto.estatus_envios_correo (id, estatus, descripcion)
VALUES
    ('1994843d-c2ac-4f80-b573-572513991603', 'Pendiente', 'Notificación registrada y pendiente de envío.'),
    ('d528f5d2-f5ae-4c8f-86b5-c594bf6e2de0', 'Procesando', 'Notificación tomada por el procesador de correo.'),
    ('6e5a0647-6dd4-4bad-bca0-65fd777a6f5c', 'Enviado', 'Notificación aceptada por el servidor SMTP.'),
    ('59ceada3-c20f-4a0d-9568-246785879245', 'Fallido', 'El último intento de envío no pudo completarse.')
ON CONFLICT DO NOTHING;


-- =========================
-- SEMILLAS CFDI
-- =========================

INSERT INTO cfdi.resultados_validaciones (id, resultado, descripcion)
VALUES
    ('23f19cea-a49a-457e-bf76-95d0ebe41a38', 'Vigente', 'El comprobante fiscal fue validado correctamente y se encuentra vigente.'),
    ('e302ac83-7188-4acb-a13e-c98b063eaced', 'Cancelado', 'El comprobante fiscal existe, pero se encuentra cancelado.'),
    ('a48888dd-203b-43b2-a13a-d724c283174a', 'No encontrado', 'El comprobante fiscal no fue encontrado en el servicio de validación.'),
    ('b2a74d3d-aa6f-4089-80e3-5b0e507ed8bd', 'Error de validación', 'Ocurrió un error al consultar el servicio de validación.')
ON CONFLICT DO NOTHING;
