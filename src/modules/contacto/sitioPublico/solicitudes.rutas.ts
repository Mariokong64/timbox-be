import { Router } from "express";
import { registrarSolicitudContactoControlador } from "./solicitudes.controlador";

const rutas = Router();

rutas.post("/", registrarSolicitudContactoControlador);

export default rutas;
