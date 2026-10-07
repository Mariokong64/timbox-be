import { pool } from "../../config/database";
import {
  Usuario,
  UsuarioDatosActualizacion,
  UsuarioDatosCreacion,
  UsuarioRow,
  PermisoPantalla,
  PermisoPantallaRow,
} from "./usuarios.types";

interface PermisoActualRow {
  pantalla_id: string;
  leer: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

function mapearUsuario(row: UsuarioRow): Usuario {
  return {
    id: row.id,
    usuario: row.usuario,
    nombre: row.nombre,
    correo: row.correo,
    fotoPerfil: row.foto_perfil,
    fechaRegistro: row.fecha_registro,
    creado: row.creado,
    modificado: row.modificado,
  };
}

export async function obtenerUsuarios(): Promise<Usuario[]> {
  const query = `
    SELECT id, usuario, nombre, correo, foto_perfil, fecha_registro, creado, modificado
    FROM sys.usuarios
    WHERE eliminado = false
    ORDER BY nombre ASC
  `;

  const result = await pool.query<UsuarioRow>(query);

  return result.rows.map(mapearUsuario);
}

export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  const query = `
    SELECT id, usuario, nombre, correo, foto_perfil, fecha_registro, creado, modificado
    FROM sys.usuarios
    WHERE id = $1 AND eliminado = false
    LIMIT 1
  `;

  const result = await pool.query<UsuarioRow>(query, [id]);
  const usuario = result.rows[0];

  return usuario ? mapearUsuario(usuario) : null;
}

export async function existeUsuarioPorNombre(usuario: string, excluirId: string | null): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM sys.usuarios
      WHERE UPPER(usuario) = UPPER($1)
        AND eliminado = false
        AND ($2::uuid IS NULL OR id <> $2::uuid)
    ) AS existe
  `;

  const result = await pool.query<{ existe: boolean }>(query, [usuario, excluirId]);

  return Boolean(result.rows[0]?.existe);
}

export async function existeUsuarioPorCorreo(correo: string, excluirId: string | null): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM sys.usuarios
      WHERE LOWER(correo) = LOWER($1)
        AND eliminado = false
        AND ($2::uuid IS NULL OR id <> $2::uuid)
    ) AS existe
  `;

  const result = await pool.query<{ existe: boolean }>(query, [correo, excluirId]);

  return Boolean(result.rows[0]?.existe);
}

export async function crearUsuario(datos: UsuarioDatosCreacion): Promise<Usuario> {
  const cliente = await pool.connect();
  const query = `
    INSERT INTO sys.usuarios (
      usuario,
      nombre,
      correo,
      contrasena,
      creado_por_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, usuario, nombre, correo, foto_perfil, fecha_registro, creado, modificado
  `;

  try {
    await cliente.query("BEGIN");
    const result = await cliente.query<UsuarioRow>(query, [
      datos.usuario,
      datos.nombre,
      datos.correo,
      datos.contrasenaHash,
      datos.creadoPorId,
    ]);
    const usuario = mapearUsuario(result.rows[0]);

    await cliente.query(
      `INSERT INTO sys.pantallas_usuarios (usuario_id, pantalla_id)
       SELECT $1, id FROM sys.pantallas`,
      [usuario.id]
    );
    await cliente.query("COMMIT");
    return usuario;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

export async function obtenerPermisosUsuario(usuarioId: string): Promise<PermisoPantalla[]> {
  const result = await pool.query<PermisoPantallaRow>(`
    SELECT p.id AS pantalla_id, p.clave, p.nombre,
           COALESCE(pu.leer, false) AS leer,
           COALESCE(pu.crear, false) AS crear,
           COALESCE(pu.editar, false) AS editar,
           COALESCE(pu.eliminar, false) AS eliminar
    FROM sys.pantallas p
    LEFT JOIN sys.pantallas_usuarios pu
      ON pu.pantalla_id = p.id AND pu.usuario_id = $1
    ORDER BY p.nombre ASC
  `, [usuarioId]);

  return result.rows.map((fila) => ({
    pantallaId: fila.pantalla_id,
    clave: fila.clave,
    nombre: fila.nombre,
    leer: fila.leer,
    crear: fila.crear,
    editar: fila.editar,
    eliminar: fila.eliminar,
  }));
}

export async function actualizarUsuario(datos: UsuarioDatosActualizacion): Promise<Usuario | null> {
  const cliente = await pool.connect();
  const query = `
    UPDATE sys.usuarios
    SET usuario = $2,
        nombre = $3,
        correo = $4,
        contrasena = COALESCE($5, contrasena),
        modificado = CURRENT_TIMESTAMP,
        modificado_por_id = $6
    WHERE id = $1 AND eliminado = false
    RETURNING id, usuario, nombre, correo, foto_perfil, fecha_registro, creado, modificado
  `;

  try {
    await cliente.query("BEGIN");
    const result = await cliente.query<UsuarioRow>(query, [
      datos.id,
      datos.usuario,
      datos.nombre,
      datos.correo,
      datos.contrasenaHash,
      datos.modificadoPorId,
    ]);
    const usuario = result.rows[0];

    if (!usuario) {
      await cliente.query("ROLLBACK");
      return null;
    }

    const resultadoPermisos = await cliente.query<PermisoActualRow>(`
      SELECT pantalla_id, leer, crear, editar, eliminar
      FROM sys.pantallas_usuarios
      WHERE usuario_id = $1
    `, [datos.id]);
    const permisosActuales = new Map(resultadoPermisos.rows.map((permiso) => [permiso.pantalla_id, permiso]));
    const cambiaronPermisos = datos.permisos.some((permiso) => {
      const anterior = permisosActuales.get(permiso.pantallaId);
      return (anterior?.leer ?? false) !== permiso.leer
        || (anterior?.crear ?? false) !== permiso.crear
        || (anterior?.editar ?? false) !== permiso.editar
        || (anterior?.eliminar ?? false) !== permiso.eliminar;
    });

    for (const permiso of datos.permisos) {
      await cliente.query(`
        INSERT INTO sys.pantallas_usuarios
          (usuario_id, pantalla_id, leer, crear, editar, eliminar)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (usuario_id, pantalla_id)
        DO UPDATE SET leer = EXCLUDED.leer,
                      crear = EXCLUDED.crear,
                      editar = EXCLUDED.editar,
                      eliminar = EXCLUDED.eliminar
      `, [datos.id, permiso.pantallaId, permiso.leer, permiso.crear, permiso.editar, permiso.eliminar]);
    }

    if (cambiaronPermisos) {
      await cliente.query(
        "UPDATE sys.usuarios SET forzar_cierre_sesion = true WHERE id = $1",
        [datos.id]
      );
    }

    await cliente.query("COMMIT");
    return mapearUsuario(usuario);
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

export async function eliminarUsuario(id: string, modificadoPorId: string | null): Promise<boolean> {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");
    const result = await cliente.query(`
      UPDATE sys.usuarios
      SET eliminado = true,
          forzar_cierre_sesion = true,
          modificado = CURRENT_TIMESTAMP,
          modificado_por_id = $2
      WHERE id = $1 AND eliminado = false
    `, [id, modificadoPorId]);

    if (!result.rowCount) {
      await cliente.query("ROLLBACK");
      return false;
    }

    await cliente.query(`
      UPDATE sys.pantallas_usuarios
      SET leer = false,
          crear = false,
          editar = false,
          eliminar = false
      WHERE usuario_id = $1
    `, [id]);

    await cliente.query("COMMIT");
    return true;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}
