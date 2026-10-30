"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePhoto = exports.addPhoto = exports.getPhotos = exports.deleteAlbum = exports.createAlbum = exports.getAlbums = void 0;
const database_1 = require("../config/database");
const getAlbums = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.pool.query(`SELECT * FROM gallery_albums ORDER BY created_at DESC`);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get albums error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAlbums = getAlbums;
const createAlbum = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description } = req.body;
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role === 'parent') {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        let cover_image_url = req.body.cover_image_url || '';
        if (req.file) {
            cover_image_url = `/uploads/${req.file.filename}`;
        }
        const result = yield database_1.pool.query(`INSERT INTO gallery_albums (title, description, cover_image_url) 
       VALUES ($1, $2, $3) RETURNING *`, [title, description || '', cover_image_url]);
        res.status(201).json({ message: 'Album created', data: result.rows[0] });
    }
    catch (error) {
        console.error('Create album error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createAlbum = createAlbum;
const deleteAlbum = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield database_1.pool.query(`DELETE FROM gallery_albums WHERE id = $1`, [id]);
        res.status(200).json({ message: 'Album deleted' });
    }
    catch (error) {
        console.error('Delete album error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteAlbum = deleteAlbum;
const getPhotos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { album_id } = req.params;
        const result = yield database_1.pool.query(`SELECT * FROM gallery_photos WHERE album_id = $1 ORDER BY created_at DESC`, [album_id]);
        res.status(200).json({ data: result.rows });
    }
    catch (error) {
        console.error('Get photos error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getPhotos = getPhotos;
const addPhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { album_id } = req.params;
        const { description } = req.body;
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role === 'parent') {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        let image_url = req.body.image_url || '';
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        }
        if (!image_url) {
            res.status(400).json({ error: 'Photo file or image URL is required' });
            return;
        }
        const result = yield database_1.pool.query(`INSERT INTO gallery_photos (album_id, image_url, description) VALUES ($1, $2, $3) RETURNING *`, [album_id, image_url, description || '']);
        res.status(201).json({ message: 'Photo added', data: result.rows[0] });
    }
    catch (error) {
        console.error('Add photo error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.addPhoto = addPhoto;
const deletePhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { photo_id } = req.params;
        yield database_1.pool.query(`DELETE FROM gallery_photos WHERE id = $1`, [photo_id]);
        res.status(200).json({ message: 'Photo deleted' });
    }
    catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deletePhoto = deletePhoto;
