// js/auth-guard.js
/*
  Este script protege las páginas del dashboard.
  Debe importarse en TODAS las páginas dentro de /pages/dashboard/
  Usa type="module"
*/
import { obtenerToken } from './api-service.js';

(function() {
    const token = obtenerToken();
    if (!token) {
        // Si no hay token, redirige al login.
        // Ajusta la ruta si tu estructura es diferente.
        window.location.href = '../auth/login.html';
    }
})();