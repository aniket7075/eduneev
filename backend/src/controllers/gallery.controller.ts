import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getAlbums = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`SELECT * FROM gallery_albums ORDER BY created_at DESC`);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get albums error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAlbum = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    const role = req.user?.role;
    
    if (role === 'parent') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    let cover_image_url = req.body.cover_image_url || '';
    if (req.file) {
      cover_image_url = `/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO gallery_albums (title, description, cover_image_url) 
       VALUES ($1, $2, $3) RETURNING *`,
      [title, description || '', cover_image_url]
    );

    res.status(201).json({ message: 'Album created', data: result.rows[0] });
  } catch (error) {
    console.error('Create album error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAlbum = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM gallery_albums WHERE id = $1`, [id]);
    res.status(200).json({ message: 'Album deleted' });
  } catch (error) {
    console.error('Delete album error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPhotos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { album_id } = req.params;
    const result = await pool.query(`SELECT * FROM gallery_photos WHERE album_id = $1 ORDER BY created_at DESC`, [album_id]);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { album_id } = req.params;
    const { description } = req.body;
    const role = req.user?.role;
    
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

    const result = await pool.query(
      `INSERT INTO gallery_photos (album_id, image_url, description) VALUES ($1, $2, $3) RETURNING *`,
      [album_id, image_url, description || '']
    );

    res.status(201).json({ message: 'Photo added', data: result.rows[0] });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { photo_id } = req.params;
    await pool.query(`DELETE FROM gallery_photos WHERE id = $1`, [photo_id]);
    res.status(200).json({ message: 'Photo deleted' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
