BEGIN;

CREATE TABLE IF NOT EXISTS contacto.destinatarios_notificacion (
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

CREATE UNIQUE INDEX IF NOT EXISTS ux_destinatarios_notificacion_correo
    ON contacto.destinatarios_notificacion (LOWER(correo));

CREATE TABLE IF NOT EXISTS contacto.estatus_envios_correo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estatus VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

INSERT INTO contacto.estatus_envios_correo (estatus, descripcion) VALUES
('Pendiente', 'Notificación registrada y pendiente de envío.'),
('Procesando', 'Notificación tomada por el procesador de correo.'),
('Enviado', 'Notificación aceptada por el servidor SMTP.'),
('Fallido', 'El último intento de envío no pudo completarse.')
ON CONFLICT (estatus) DO NOTHING;

CREATE TABLE IF NOT EXISTS contacto.envios_solicitudes_contacto (
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

CREATE UNIQUE INDEX IF NOT EXISTS ux_envios_solicitudes_contacto_destinatario
    ON contacto.envios_solicitudes_contacto (
        solicitud_contacto_id,
        LOWER(correo_destinatario)
    );

CREATE INDEX IF NOT EXISTS ix_envios_solicitudes_contacto_procesamiento
    ON contacto.envios_solicitudes_contacto (
        estatus_envio_id,
        proximo_intento,
        creado
    );

COMMIT;
