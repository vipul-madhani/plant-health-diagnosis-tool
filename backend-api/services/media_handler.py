"""
Media Handler Service
Handles voice messages, images, and other media files for chat
Supports compression, cloud storage, and local caching
"""

import os
import uuid
import hashlib
import mimetypes
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple
from PIL import Image
import io

class MediaHandler:
    """
    Handles media uploads, compression, and storage for chat messages
    """
    
    def __init__(self, storage_path: str = "./uploads", cloud_storage=None):
        self.storage_path = Path(storage_path)
        self.cloud_storage = cloud_storage  # S3/Azure/GCS client (optional)
        
        # Create storage directories
        self.images_dir = self.storage_path / "images"
        self.voice_dir = self.storage_path / "voice"
        self.thumbnails_dir = self.storage_path / "thumbnails"
        
        for directory in [self.images_dir, self.voice_dir, self.thumbnails_dir]:
            directory.mkdir(parents=True, exist_ok=True)
        
        # File size limits (MB)
        self.MAX_IMAGE_SIZE = 10
        self.MAX_VOICE_SIZE = 5
        
        # Supported formats
        self.ALLOWED_IMAGE_FORMATS = {'.jpg', '.jpeg', '.png', '.webp'}
        self.ALLOWED_VOICE_FORMATS = {'.mp3', '.m4a', '.aac', '.ogg', '.wav'}
    
    def generate_file_id(self, original_filename: str) -> str:
        """Generate unique file ID"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        random_id = uuid.uuid4().hex[:8]
        ext = Path(original_filename).suffix.lower()
        return f"{timestamp}_{random_id}{ext}"
    
    def calculate_file_hash(self, file_data: bytes) -> str:
        """Calculate SHA256 hash of file for deduplication"""
        return hashlib.sha256(file_data).hexdigest()
    
    def validate_file(self, file_data: bytes, file_type: str) -> Tuple[bool, Optional[str]]:
        """Validate file size and type"""
        file_size_mb = len(file_data) / (1024 * 1024)
        
        if file_type == 'image':
            if file_size_mb > self.MAX_IMAGE_SIZE:
                return False, f"Image size {file_size_mb:.2f}MB exceeds limit of {self.MAX_IMAGE_SIZE}MB"
        elif file_type == 'voice':
            if file_size_mb > self.MAX_VOICE_SIZE:
                return False, f"Voice file size {file_size_mb:.2f}MB exceeds limit of {self.MAX_VOICE_SIZE}MB"
        
        return True, None
    
    def compress_image(
        self, 
        image_data: bytes, 
        max_dimension: int = 1920,
        quality: int = 85
    ) -> Tuple[bytes, Dict]:
        """
        Compress and resize image
        Returns compressed data and metadata
        """
        try:
            # Open image
            img = Image.open(io.BytesIO(image_data))
            
            # Get original dimensions
            original_width, original_height = img.size
            original_format = img.format
            
            # Convert RGBA to RGB if necessary
            if img.mode == 'RGBA':
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])  # 3 is the alpha channel
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if needed
            if max(original_width, original_height) > max_dimension:
                ratio = max_dimension / max(original_width, original_height)
                new_width = int(original_width * ratio)
                new_height = int(original_height * ratio)
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Compress
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            compressed_data = output.getvalue()
            
            metadata = {
                'original_size': len(image_data),
                'compressed_size': len(compressed_data),
                'original_dimensions': {'width': original_width, 'height': original_height},
                'final_dimensions': {'width': img.size[0], 'height': img.size[1]},
                'compression_ratio': round(len(compressed_data) / len(image_data), 2),
                'original_format': original_format
            }
            
            return compressed_data, metadata
            
        except Exception as e:
            raise ValueError(f"Failed to compress image: {str(e)}")
    
    def create_thumbnail(
        self, 
        image_data: bytes, 
        size: Tuple[int, int] = (200, 200)
    ) -> bytes:
        """
        Create thumbnail for image
        """
        try:
            img = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB
            if img.mode != 'RGB':
                if img.mode == 'RGBA':
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3])
                    img = background
                else:
                    img = img.convert('RGB')
            
            # Create thumbnail
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=80)
            return output.getvalue()
            
        except Exception as e:
            raise ValueError(f"Failed to create thumbnail: {str(e)}")
    
    def upload_image(
        self, 
        image_data: bytes,
        filename: str,
        user_id: str,
        compress: bool = True
    ) -> Dict:
        """
        Upload and process image
        Returns file info with URLs
        """
        # Validate
        is_valid, error = self.validate_file(image_data, 'image')
        if not is_valid:
            raise ValueError(error)
        
        # Generate unique filename
        file_id = self.generate_file_id(filename)
        
        # Compress if requested
        if compress:
            processed_data, metadata = self.compress_image(image_data)
        else:
            processed_data = image_data
            metadata = {'original_size': len(image_data), 'compressed_size': len(image_data)}
        
        # Create thumbnail
        thumbnail_data = self.create_thumbnail(processed_data)
        thumbnail_id = f"thumb_{file_id}"
        
        # Calculate hash for deduplication
        file_hash = self.calculate_file_hash(processed_data)
        
        # Save to local storage
        image_path = self.images_dir / file_id
        with open(image_path, 'wb') as f:
            f.write(processed_data)
        
        thumbnail_path = self.thumbnails_dir / thumbnail_id
        with open(thumbnail_path, 'wb') as f:
            f.write(thumbnail_data)
        
        # Upload to cloud storage if configured
        cloud_url = None
        thumbnail_cloud_url = None
        
        if self.cloud_storage:
            try:
                cloud_url = self.cloud_storage.upload(processed_data, f"images/{file_id}")
                thumbnail_cloud_url = self.cloud_storage.upload(thumbnail_data, f"thumbnails/{thumbnail_id}")
            except Exception as e:
                print(f"Cloud upload failed: {str(e)}. Using local storage.")
        
        return {
            'file_id': file_id,
            'original_filename': filename,
            'file_hash': file_hash,
            'local_path': str(image_path),
            'cloud_url': cloud_url,
            'thumbnail': {
                'file_id': thumbnail_id,
                'local_path': str(thumbnail_path),
                'cloud_url': thumbnail_cloud_url
            },
            'metadata': metadata,
            'uploaded_by': user_id,
            'uploaded_at': datetime.now().isoformat(),
            'media_type': 'image'
        }
    
    def upload_voice(
        self, 
        voice_data: bytes,
        filename: str,
        user_id: str,
        duration_seconds: Optional[int] = None
    ) -> Dict:
        """
        Upload voice message
        Returns file info with URLs
        """
        # Validate
        is_valid, error = self.validate_file(voice_data, 'voice')
        if not is_valid:
            raise ValueError(error)
        
        # Generate unique filename
        file_id = self.generate_file_id(filename)
        
        # Calculate hash
        file_hash = self.calculate_file_hash(voice_data)
        
        # Save to local storage
        voice_path = self.voice_dir / file_id
        with open(voice_path, 'wb') as f:
            f.write(voice_data)
        
        # Upload to cloud storage if configured
        cloud_url = None
        
        if self.cloud_storage:
            try:
                cloud_url = self.cloud_storage.upload(voice_data, f"voice/{file_id}")
            except Exception as e:
                print(f"Cloud upload failed: {str(e)}. Using local storage.")
        
        return {
            'file_id': file_id,
            'original_filename': filename,
            'file_hash': file_hash,
            'local_path': str(voice_path),
            'cloud_url': cloud_url,
            'duration_seconds': duration_seconds,
            'file_size': len(voice_data),
            'uploaded_by': user_id,
            'uploaded_at': datetime.now().isoformat(),
            'media_type': 'voice'
        }
    
    def get_file_url(self, file_id: str, media_type: str) -> Optional[str]:
        """
        Get URL for file (cloud if available, local otherwise)
        """
        if media_type == 'image':
            directory = self.images_dir
        elif media_type == 'voice':
            directory = self.voice_dir
        elif media_type == 'thumbnail':
            directory = self.thumbnails_dir
        else:
            return None
        
        file_path = directory / file_id
        
        if file_path.exists():
            # For local dev, return file path
            # In production, return signed URL from cloud storage
            if self.cloud_storage:
                try:
                    return self.cloud_storage.get_signed_url(f"{media_type}/{file_id}")
                except:
                    pass
            
            return f"/uploads/{media_type}/{file_id}"
        
        return None
    
    def delete_file(self, file_id: str, media_type: str) -> bool:
        """
        Delete file from storage
        """
        try:
            if media_type == 'image':
                directory = self.images_dir
                # Also delete thumbnail
                thumbnail_path = self.thumbnails_dir / f"thumb_{file_id}"
                if thumbnail_path.exists():
                    thumbnail_path.unlink()
            elif media_type == 'voice':
                directory = self.voice_dir
            else:
                return False
            
            file_path = directory / file_id
            if file_path.exists():
                file_path.unlink()
            
            # Delete from cloud if configured
            if self.cloud_storage:
                try:
                    self.cloud_storage.delete(f"{media_type}/{file_id}")
                except:
                    pass
            
            return True
        except Exception as e:
            print(f"Failed to delete file: {str(e)}")
            return False
    
    def get_file_metadata(self, file_id: str, media_type: str) -> Optional[Dict]:
        """
        Get file metadata (size, mime type, etc.)
        """
        if media_type == 'image':
            directory = self.images_dir
        elif media_type == 'voice':
            directory = self.voice_dir
        else:
            return None
        
        file_path = directory / file_id
        
        if not file_path.exists():
            return None
        
        stat = file_path.stat()
        mime_type, _ = mimetypes.guess_type(str(file_path))
        
        return {
            'file_id': file_id,
            'size': stat.st_size,
            'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'mime_type': mime_type,
            'media_type': media_type
        }
    
    def cleanup_old_files(self, days_old: int = 90):
        """
        Clean up files older than specified days
        """
        from datetime import timedelta
        
        cutoff_time = datetime.now() - timedelta(days=days_old)
        deleted_count = 0
        
        for directory in [self.images_dir, self.voice_dir, self.thumbnails_dir]:
            for file_path in directory.iterdir():
                if file_path.is_file():
                    mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                    if mtime < cutoff_time:
                        file_path.unlink()
                        deleted_count += 1
        
        return {'deleted_count': deleted_count}

# Singleton instance
_media_handler = None

def get_media_handler(storage_path: str = "./uploads", cloud_storage=None) -> MediaHandler:
    """Get or create media handler singleton"""
    global _media_handler
    if _media_handler is None:
        _media_handler = MediaHandler(storage_path, cloud_storage)
    return _media_handler
