import { obtenerToken } from './api-service.js';

(function() {
    const token = obtenerToken();
    if (!token) {
       
        window.location.href = '../auth/login.html';
    }
})();