import { Router } from "express";
import {
  cerrarSolicitudControlador,
  guardarRespuestaControlador,
  listarSolicitudesControlador,
  obtenerSolicitudControlador,
} from "./solicitudes.controlador";

const rutas = Router();

rutas.get("/solicitudes", listarSolicitudesControlador);
rutas.get("/solicitudes/:id", obtenerSolicitudControlador);
rutas.post("/solicitudes/:id/respuestas", guardarRespuestaControlador);
rutas.post("/solicitudes/:id/cerrar", cerrarSolicitudControlador);

export default rutas;
