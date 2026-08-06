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
-- CONTENIDOS
-- =========================

CREATE TABLE contenidos.secciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seccion VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE contenidos.enlaces_url (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    seccion_id UUID NOT NULL,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_enlaces_url_seccion
        FOREIGN KEY (seccion_id)
        REFERENCES contenidos.secciones(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX ix_enlaces_url_seccion_activo
    ON contenidos.enlaces_url (seccion_id, activo);

-- =========================
-- SYS
-- =========================

CREATE TABLE sys.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    contrasena TEXT NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    foto_perfil TEXT,

    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_por_id UUID,
    modificado TIMESTAMP,
    modificado_por_id UUID,

    CONSTRAINT fk_usuarios_creado_por
        FOREIGN KEY (creado_por_id)
        REFERENCES sys.usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_usuarios_modificado_por
        FOREIGN KEY (modificado_por_id)
        REFERENCES sys.usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =========================
-- CHATBOT
-- =========================

CREATE TABLE chatbot.estatus_conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estatus VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE chatbot.emisores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emisor VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE chatbot.conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    estatus_id UUID NOT NULL,

    CONSTRAINT fk_conversaciones_estatus
        FOREIGN KEY (estatus_id)
        REFERENCES chatbot.estatus_conversaciones(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE chatbot.mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contenido TEXT NOT NULL,
    emisor_id UUID NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    conversacion_id UUID NOT NULL,

    CONSTRAINT fk_mensajes_emisor
        FOREIGN KEY (emisor_id)
        REFERENCES chatbot.emisores(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_mensajes_conversacion
        FOREIGN KEY (conversacion_id)
        REFERENCES chatbot.conversaciones(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =========================
-- CONTACTO
-- =========================

CREATE TABLE contacto.estatus_solicitudes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estatus VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE contacto.origenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origen VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE contacto.solicitudes_contacto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    rfc VARCHAR(13),
    mensaje TEXT,
    estatus_id UUID NOT NULL,
    origen_id UUID NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    conversacion_id UUID,

    CONSTRAINT fk_solicitudes_contacto_estatus
        FOREIGN KEY (estatus_id)
        REFERENCES contacto.estatus_solicitudes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_solicitudes_contacto_origen
        FOREIGN KEY (origen_id)
        REFERENCES contacto.origenes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_solicitudes_contacto_conversacion
        FOREIGN KEY (conversacion_id)
        REFERENCES chatbot.conversaciones(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE contacto.destinatarios_notificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correo TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_por_id UUID NOT NULL,
    modificado TIMESTAMP WITHOUT TIME ZONE,
    modificado_por_id UUID,

    CONSTRAINT ck_destinatarios_notificacion_correo
        CHECK (
            correo = BTRIM(correo)
            AND correo ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
        ),

    CONSTRAINT ck_destinatarios_notificacion_modificacion
        CHECK (
            (modificado IS NULL AND modificado_por_id IS NULL)
            OR
            (modificado IS NOT NULL AND modificado_por_id IS NOT NULL)
        ),

    CONSTRAINT fk_destinatarios_notificacion_creado_por
        FOREIGN KEY (creado_por_id)
        REFERENCES sys.usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_destinatarios_notificacion_modificado_por
        FOREIGN KEY (modificado_por_id)
        REFERENCES sys.usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE UNIQUE INDEX ux_destinatarios_notificacion_correo
    ON contacto.destinatarios_notificacion (LOWER(correo));

CREATE TABLE contacto.estatus_envios_correo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estatus VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE contacto.envios_solicitudes_contacto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_contacto_id UUID NOT NULL,
    destinatario_notificacion_id UUID,
    correo_destinatario TEXT NOT NULL,
    estatus_envio_id UUID NOT NULL,
    intentos INTEGER NOT NULL DEFAULT 0,
    proximo_intento TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_intento TIMESTAMP WITHOUT TIME ZONE,
    fecha_envio TIMESTAMP WITHOUT TIME ZONE,
    mensaje_id TEXT,
    ultimo_error TEXT,
    creado TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificado TIMESTAMP WITHOUT TIME ZONE,

    CONSTRAINT ck_envios_solicitudes_contacto_intentos
        CHECK (intentos >= 0),

    CONSTRAINT fk_envios_solicitudes_contacto_solicitud
        FOREIGN KEY (solicitud_contacto_id)
        REFERENCES contacto.solicitudes_contacto(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_envios_solicitudes_contacto_destinatario
        FOREIGN KEY (destinatario_notificacion_id)
        REFERENCES contacto.destinatarios_notificacion(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_envios_solicitudes_contacto_estatus
        FOREIGN KEY (estatus_envio_id)
        REFERENCES contacto.estatus_envios_correo(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE UNIQUE INDEX ux_envios_solicitudes_contacto_destinatario
    ON contacto.envios_solicitudes_contacto (
        solicitud_contacto_id,
        LOWER(correo_destinatario)
    );

CREATE INDEX ix_envios_solicitudes_contacto_procesamiento
    ON contacto.envios_solicitudes_contacto (
        estatus_envio_id,
        proximo_intento,
        creado
    );

CREATE TABLE contacto.atenciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    solicitud_id UUID NOT NULL,
    detalles TEXT,
    fecha_atencion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_atenciones_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES sys.usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_atenciones_solicitud
        FOREIGN KEY (solicitud_id)
        REFERENCES contacto.solicitudes_contacto(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =========================
-- CFDI / VALIDACIONES
-- =========================

CREATE TABLE cfdi.resultados_validaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resultado VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE cfdi.validaciones_cfdi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resultado_id UUID NOT NULL,
    rfc_emisor VARCHAR(13),
    rfc_receptor VARCHAR(13),
    total NUMERIC(14, 2),
    uuid_cfdi VARCHAR(36),
    nombre_archivo VARCHAR(255),
    fecha_validacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_validaciones_cfdi_resultado
        FOREIGN KEY (resultado_id)
        REFERENCES cfdi.resultados_validaciones(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- =========================
-- CATÁLOGOS CONTENIDOS
-- =========================

INSERT INTO contenidos.secciones (seccion, descripcion) VALUES
('Empresa', 'Textos administrables de la sección Empresa del sitio público.'),
('Soluciones', 'Textos administrables de la sección Soluciones del sitio público.'),
('General', 'Enlaces generales reutilizados en distintas secciones del sitio público.'),
('Integradores', 'Repositorios y recursos de integración publicados en el sitio.');

INSERT INTO contenidos.enlaces_url (clave, url, seccion_id, activo)
SELECT datos.clave, datos.url, seccion.id, TRUE
FROM (
  VALUES
    ('aplicacion_gratuita', 'https://appgratis.timbox.com.mx/acceso'),
    ('timbox_dashboard_registro', 'http://grupotum.com:9020/registro'),
    ('timbox_dashboard_acceso', 'http://grupotum.com:9020/acceso'),
    ('timbox_linkedin', 'https://www.linkedin.com/company/timbox/'),
    ('timbox_facebook', 'https://www.facebook.com/TimboxPAC/')
) AS datos(clave, url)
CROSS JOIN contenidos.secciones AS seccion
WHERE LOWER(seccion.seccion) = 'general';

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
WHERE LOWER(seccion.seccion) = 'integradores';

-- =========================
-- CATÁLOGOS CHATBOT
-- =========================

INSERT INTO chatbot.estatus_conversaciones (estatus, descripcion) VALUES
('Abierta', 'La conversación se encuentra activa.'),
('Finalizada', 'La conversación fue finalizada.'),
('Derivada a contacto', 'La conversación generó una solicitud de contacto.');

INSERT INTO chatbot.emisores (emisor, descripcion) VALUES
('Usuario', 'Mensaje enviado por el visitante del sitio público.'),
('Chatbot', 'Mensaje generado automáticamente por el chatbot.'),
('Sistema', 'Mensaje generado por reglas internas del sistema.'),
('Administrador', 'Mensaje generado por un administrador del sistema.');

-- =========================
-- CATÁLOGOS CONTACTO
-- =========================

INSERT INTO contacto.estatus_solicitudes (estatus, descripcion) VALUES
('Nueva', 'Solicitud registrada y pendiente de atención.'),
('En atención', 'Solicitud revisada por un usuario del sistema.'),
('Atendida', 'Solicitud atendida correctamente.'),
('Descartada', 'Solicitud descartada por no proceder o por información insuficiente.');

INSERT INTO contacto.origenes (origen, descripcion) VALUES
('Formulario público', 'Solicitud generada desde el formulario de contacto del sitio público.'),
('Chatbot', 'Solicitud generada durante una conversación con el chatbot.');

INSERT INTO contacto.estatus_envios_correo (estatus, descripcion) VALUES
('Pendiente', 'Notificación registrada y pendiente de envío.'),
('Procesando', 'Notificación tomada por el procesador de correo.'),
('Enviado', 'Notificación aceptada por el servidor SMTP.'),
('Fallido', 'El último intento de envío no pudo completarse.');

-- =========================
-- CATÁLOGOS CFDI
-- =========================

INSERT INTO cfdi.resultados_validaciones (resultado, descripcion) VALUES
('Vigente', 'El comprobante fiscal fue validado correctamente y se encuentra vigente.'),
('Cancelado', 'El comprobante fiscal existe, pero se encuentra cancelado.'),
('No encontrado', 'El comprobante fiscal no fue encontrado en el servicio de validación.'),
('Error de validación', 'Ocurrió un error al consultar el servicio de validación.');
