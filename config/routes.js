import { Router } from 'express';
import infoController from '../controllers/infoControllers.js';
// import upload from './multer.js';
// import { upload, uploadFile } from '../controllers/uploadController.js'; // Usa la importación nombrada

const router = new Router();

// Rutas existentes
router.post('/info', infoController.store);
router.post('/login', infoController.login);
router.get('/userinfo', infoController.getUserInfo);
router.put('/updateUserInfo', infoController.updateUserInfo);
router.post('/deleteUser', infoController.deleteUser);
router.get('/getUserClothes', infoController.getUserClothes);
router.get('/getClothesByName', infoController.getClothesByName);
router.get('/getClothesByCategory', infoController.getClothesByCategory);
router.post('/guardarPrenda', infoController.saveClothing);
router.post('/saveFavorites', infoController.saveFavorites);
router.get('/favoritos', infoController.getFavorites);

export default router;
