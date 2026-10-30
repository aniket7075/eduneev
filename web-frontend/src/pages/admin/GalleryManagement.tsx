import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartSidebar from '../../components/SmartSidebar';
import apiClient, { formatMediaUrl } from '../../api/client';
import { Plus, ArrowLeft, Image as ImageIcon, Camera, X, PlayCircle, Film, Trash2 } from 'lucide-react';
import './Directory.css';

interface Album {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
}

interface Photo {
  id: string;
  album_id: string;
  image_url: string;
  description: string;
  created_at: string;
}

const GalleryManagement: React.FC = () => {
  const navigate = useNavigate();
  
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Album State
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Lightbox
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Create Album Modal
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [albumFormData, setAlbumFormData] = useState({ title: '', description: '' });
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [savingAlbum, setSavingAlbum] = useState(false);
  const albumFileInputRef = useRef<HTMLInputElement>(null);

  // Upload Photo Modal
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/gallery');
      setAlbums(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch albums', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (albumId: string) => {
    setPhotosLoading(true);
    try {
      const response = await apiClient.get(`/gallery/${albumId}/photos`);
      setPhotos(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch photos', error);
    } finally {
      setPhotosLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (selectedAlbum) {
      fetchPhotos(selectedAlbum.id);
    }
  }, [selectedAlbum]);

  const handleCreateAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumFormData.title.trim()) {
      alert('Album title is required');
      return;
    }

    setSavingAlbum(true);
    try {
      const formData = new FormData();
      formData.append('title', albumFormData.title.trim());
      formData.append('description', albumFormData.description.trim());
      
      if (albumCoverFile) {
        formData.append('cover_image', albumCoverFile);
      }

      await apiClient.post('/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsAlbumModalOpen(false);
      setAlbumFormData({ title: '', description: '' });
      setAlbumCoverFile(null);
      fetchAlbums();
    } catch (error: any) {
      console.error('Failed to create album', error);
      alert(error.response?.data?.error || 'Could not create album');
    } finally {
      setSavingAlbum(false);
    }
  };

  const handleUploadPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbum) return;
    if (!photoFile) {
      alert('Please select a photo or video to upload');
      return;
    }

    setSavingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('description', photoDesc.trim());
      formData.append('photo', photoFile);

      await apiClient.post(`/gallery/${selectedAlbum.id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsPhotoModalOpen(false);
      setPhotoDesc('');
      setPhotoFile(null);
      fetchPhotos(selectedAlbum.id);
    } catch (error: any) {
      console.error('Failed to upload media', error);
      alert(error.response?.data?.error || 'Could not upload media');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleDeleteAlbum = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the album "${title}"?`)) return;
    
    try {
      await apiClient.delete(`/gallery/${id}`);
      fetchAlbums();
    } catch (error: any) {
      console.error('Failed to delete album', error);
      alert(error.response?.data?.error || 'Could not delete album');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!selectedAlbum) return;
    if (!window.confirm(`Are you sure you want to delete this media?`)) return;
    
    try {
      await apiClient.delete(`/gallery/photos/${photoId}`);
      fetchPhotos(selectedAlbum.id);
      setSelectedPhoto(null);
    } catch (error: any) {
      console.error('Failed to delete photo', error);
      alert(error.response?.data?.error || 'Could not delete media');
    }
  };

  const isVideoFile = (url: string) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.match(/\.(mp4|mov|mkv|quicktime|3gp|3gpp|avi|webm|mpeg|ogg)$/);
  };

  const isVideoLocal = (file: File | null) => {
    if (!file) return false;
    return file.type.startsWith('video/') || isVideoFile(file.name);
  };

  const renderAlbumsView = () => (
    <>
      <header className="header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="welcome-text">School Gallery</h1>
            <p className="date-text">Manage school memories and event photos</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setIsAlbumModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4F46E5', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}>
          <Plus size={20} /> Create Album
        </button>
      </header>

      {loading ? (
        <div className="flex-center py-8 text-muted">Loading albums...</div>
      ) : albums.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {albums.map((album) => (
            <div 
              key={album.id} 
              className="glass-card" 
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #F1F5F9' }}
              onClick={() => setSelectedAlbum(album)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ height: '200px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {album.cover_image_url ? (
                  <img src={formatMediaUrl(album.cover_image_url)} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={48} color="#CBD5E1" />
                )}
              </div>
              <div style={{ padding: '1.25rem', position: 'relative' }}>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', paddingRight: '2rem' }}>{album.title}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {album.description || 'No description provided'}
                </p>
                <button 
                  onClick={(e) => handleDeleteAlbum(e, album.id, album.title)}
                  style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#FEE2E2', border: 'none', color: '#DC2626', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                  title="Delete Album"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <ImageIcon size={64} color="#E2E8F0" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No albums found</h3>
          <p style={{ margin: 0, color: '#94A3B8' }}>Create your first album to start adding memories.</p>
        </div>
      )}
    </>
  );

  const renderPhotosView = () => (
    <>
      <header className="header" style={{ marginBottom: '1.5rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setSelectedAlbum(null)} style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Back to Albums">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Album</p>
            <h1 style={{ margin: '0.2rem 0 0 0', fontSize: '1.5rem', fontWeight: 900, color: '#0F172A' }}>{selectedAlbum?.title}</h1>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setIsPhotoModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4F46E5' }}>
          <Camera size={20} /> Add Media
        </button>
      </header>

      {photosLoading ? (
        <div className="flex-center py-8 text-muted">Loading media...</div>
      ) : photos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {photos.map((photo) => {
            const isVid = isVideoFile(photo.image_url);
            return (
              <div 
                key={photo.id} 
                className="glass-card" 
                style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', border: '1px solid #F1F5F9' }}
                onClick={() => isVid ? window.open(formatMediaUrl(photo.image_url), '_blank') : setSelectedPhoto(photo)}
              >
                <div style={{ height: '200px', backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {isVid ? (
                    <>
                      <PlayCircle size={48} color="white" opacity={0.8} />
                      <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>Video</div>
                    </>
                  ) : (
                    <img src={formatMediaUrl(photo.image_url)} alt="Media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                {photo.description && (
                  <div style={{ padding: '0.75rem', background: 'white' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {photo.description}
                    </p>
                  </div>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255,255,255,0.9)', border: 'none', color: '#DC2626', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  title="Delete Media"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <ImageIcon size={64} color="#E2E8F0" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No photos or videos</h3>
          <p style={{ margin: 0, color: '#94A3B8' }}>Click 'Add Media' to upload memories to this album.</p>
        </div>
      )}
    </>
  );

  return (
    <div className="dashboard-layout">
      <SmartSidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        
        {selectedAlbum ? renderPhotosView() : renderAlbumsView()}

        {/* Create Album Modal */}
        {isAlbumModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#1E293B', margin: 0 }}>Create New Album</h2>
                </div>
                <button className="icon-btn" onClick={() => setIsAlbumModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleCreateAlbumSubmit} style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Album Title *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g., Annual Sports Day 2026" 
                      value={albumFormData.title} 
                      onChange={(e) => setAlbumFormData({...albumFormData, title: e.target.value})} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="input-field" 
                      placeholder="Short memory notes..." 
                      value={albumFormData.description} 
                      onChange={(e) => setAlbumFormData({...albumFormData, description: e.target.value})} 
                      rows={3} 
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cover Photo</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      ref={albumFileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAlbumCoverFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div 
                      onClick={() => albumFileInputRef.current?.click()}
                      style={{ border: '2px dashed #C7D2FE', background: '#EEF2FF', padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
                    >
                      {albumCoverFile ? (
                        <div>
                          <ImageIcon size={32} color="#4F46E5" style={{ marginBottom: '0.5rem' }} />
                          <p style={{ margin: 0, color: '#4F46E5', fontWeight: 600, fontSize: '0.9rem' }}>{albumCoverFile.name}</p>
                        </div>
                      ) : (
                        <div>
                          <Camera size={32} color="#6366F1" style={{ marginBottom: '0.5rem' }} />
                          <p style={{ margin: 0, color: '#6366F1', fontWeight: 600, fontSize: '0.9rem' }}>Click to select cover image</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsAlbumModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={savingAlbum} className="btn-primary" style={{ background: '#4F46E5' }}>
                    {savingAlbum ? 'Creating...' : 'Create Album'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Photo Modal */}
        {isPhotoModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: '#1E293B', margin: 0 }}>Upload Media</h2>
                </div>
                <button className="icon-btn" onClick={() => setIsPhotoModalOpen(false)} style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                  <X size={20} color="#64748B" />
                </button>
              </div>
              
              <form onSubmit={handleUploadPhotoSubmit} style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  
                  <div className="form-group">
                    <label className="form-label">Select Photo / Video *</label>
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      style={{ display: 'none' }} 
                      ref={photoFileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPhotoFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div 
                      onClick={() => photoFileInputRef.current?.click()}
                      style={{ border: '2px dashed #C7D2FE', background: '#EEF2FF', padding: '2rem', borderRadius: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
                    >
                      {photoFile ? (
                        <div>
                          {isVideoLocal(photoFile) ? <Film size={32} color="#4F46E5" /> : <ImageIcon size={32} color="#4F46E5" />}
                          <p style={{ margin: '0.5rem 0 0 0', color: '#4F46E5', fontWeight: 600, fontSize: '0.9rem' }}>{photoFile.name}</p>
                        </div>
                      ) : (
                        <div>
                          <Camera size={32} color="#6366F1" style={{ marginBottom: '0.5rem' }} />
                          <p style={{ margin: 0, color: '#6366F1', fontWeight: 600, fontSize: '0.9rem' }}>Click to select media</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Caption / Description</label>
                    <textarea 
                      className="input-field" 
                      placeholder="e.g. Children performing at the annual day..." 
                      value={photoDesc} 
                      onChange={(e) => setPhotoDesc(e.target.value)} 
                      rows={3} 
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsPhotoModalOpen(false)}>Cancel</button>
                  <button type="submit" disabled={savingPhoto} className="btn-primary" style={{ background: '#4F46E5' }}>
                    {savingPhoto ? 'Uploading...' : 'Upload Media'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lightbox for Photos */}
        {selectedPhoto && (
          <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '100%', padding: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedPhoto(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2rem' }}>
              <img 
                src={formatMediaUrl(selectedPhoto.image_url)} 
                alt="Fullscreen" 
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
              />
            </div>
            
            {selectedPhoto.description ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ margin: 0, color: 'white', fontSize: '1.1rem', background: 'rgba(0,0,0,0.5)', display: 'inline-block', padding: '1rem 2rem', borderRadius: '1rem' }}>
                  {selectedPhoto.description}
                </p>
              </div>
            ) : (
              <div style={{ height: '4rem' }} />
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default GalleryManagement;
