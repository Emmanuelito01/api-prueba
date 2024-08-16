import { Router } from 'express';
import infoController from '../controllers/infoControllers.js';
// import { upload, uploadFile } from '../controllers/uploadController.js'; // Usa la importación nombrada

const router = new Router();

// Rutas existentes
router.post('/info', infoController.store);
router.post('/login', infoController.login);
router.get('/userinfo', infoController.getUserInfo);
router.put('/updateUserInfo', infoController.updateUserInfo);
router.post('/deleteUser', infoController.deleteUser);

// Ruta para la carga de archivos
// router.post('/upload', upload.single('file'), uploadFile);

export default router;
