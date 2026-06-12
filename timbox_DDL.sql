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

CREATE TABLE contenidos.estatus_enlaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estatus VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE contenidos.contenidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) NOT NULL UNIQUE,
    contenido TEXT NOT NULL,
    seccion_id UUID NOT NULL,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contenidos_seccion
        FOREIGN KEY (seccion_id)
        REFERENCES contenidos.secciones(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE contenidos.enlaces_url (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    seccion_id UUID NOT NULL,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estatus_id UUID NOT NULL,

    CONSTRAINT fk_enlaces_url_seccion
        FOREIGN KEY (seccion_id)
        REFERENCES contenidos.secciones(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_enlaces_url_estatus
        FOREIGN KEY (estatus_id)
        REFERENCES contenidos.estatus_enlaces(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================
-- SYS
-- =========================

CREATE TABLE sys.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    contrasena TEXT NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,

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

INSERT INTO contenidos.estatus_enlaces (estatus, descripcion) VALUES
('Activo', 'El enlace se encuentra disponible para su uso en el sitio público.'),
('Inactivo', 'El enlace no debe mostrarse o utilizarse en el sitio público.');

INSERT INTO contenidos.secciones (seccion, descripcion) VALUES
('Inicio', 'Contenido mostrado en la página principal del sitio público.'),
('Integración tecnológica', 'Contenido relacionado con la sección de la integración tecnológica'),
('Soluciones', 'Contenido relacionado con la sección de soluciones'),
('Soporte y documentación', 'Contenido mostrado en la sección de soporte y documentación'),
('Políticas y términos legales', 'Contenido mostrado en la sección de las políticas y términos legales'),
('Preguntas frecuantes FAQ', 'Contenido de la parte de las preguntas frecuentes');

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

-- =========================
-- CATÁLOGOS CFDI
-- =========================

INSERT INTO cfdi.resultados_validaciones (resultado, descripcion) VALUES
('Vigente', 'El comprobante fiscal fue validado correctamente y se encuentra vigente.'),
('Cancelado', 'El comprobante fiscal existe, pero se encuentra cancelado.'),
('No encontrado', 'El comprobante fiscal no fue encontrado en el servicio de validación.'),
('Error de validación', 'Ocurrió un error al consultar el servicio de validación.');