import { Router } from 'express';
import { getAlbums, createAlbum, deleteAlbum, getPhotos, addPhoto, deletePhoto } from '../controllers/gallery.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAlbums);
router.post('/', uploadMiddleware.single('cover_image'), createAlbum);
router.delete('/:id', deleteAlbum);
router.get('/:album_id/photos', getPhotos);
router.post('/:album_id/photos', uploadMiddleware.single('photo'), addPhoto);
router.delete('/photos/:photo_id', deletePhoto);

export default router;
