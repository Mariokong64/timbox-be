import { pool } from "../../config/database";
import {
  Usuario,
  UsuarioDatosActualizacion,
  UsuarioDatosCreacion,
  UsuarioRow,
} from "./usuarios.types";

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
    ORDER BY nombre ASC
  `;

  const result = await pool.query<UsuarioRow>(query);

  return result.rows.map(mapearUsuario);
}

export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  const query = `
    SELECT id, usuario, nombre, correo, foto_perfil, fecha_registro, creado, modificado
    FROM sys.usuarios
    WHERE id = $1
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
        AND ($2::uuid IS NULL OR id <> $2::uuid)
    ) AS existe
  `;

  const result = await pool.query<{ existe: boolean }>(query, [usuario, excluirId]);

  return Boolean(result.rows[0]?.existe);
}

export async function crearUsuario(datos: UsuarioDatosCreacion): Promise<Usuario> {
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

  const result = await pool.query<UsuarioRow>(query, [
    datos.usuario,
    datos.nombre,
    datos.correo,
    datos.contrasenaHash,
    datos.creadoPorId,
  ]);

  return mapearUsuario(result.rows[0]);
}

export async function actualizarUsuario(datos: UsuarioDatosActualizacion): Promise<Usuario | null> {
  const query = `
    UPDATE sys.usuarios
    SET usuario = $2,
        nombre = $3,
        correo = $4,
        contrasena = COALESCE($5, contrasena),
        modificado = CURRENT_TIMESTAMP,
        modificado_por_id = $6
    WHERE id = $1
    RETURNING id, usuario, nombre, correo, foto_perfil, fecha_registro, creado, modificado
  `;

  const result = await pool.query<UsuarioRow>(query, [
    datos.id,
    datos.usuario,
    datos.nombre,
    datos.correo,
    datos.contrasenaHash,
    datos.modificadoPorId,
  ]);
  const usuario = result.rows[0];

  return usuario ? mapearUsuario(usuario) : null;
}

export async function eliminarUsuario(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM sys.usuarios WHERE id = $1", [id]);

  return (result.rowCount ?? 0) > 0;
}
