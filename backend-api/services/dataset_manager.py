"""
Dataset Manager Service for ML Model Enrichment
Handles dataset upload, validation, versioning, and quality checks
"""

import os
import json
import hashlib
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from PIL import Image
import numpy as np
from collections import defaultdict

class DatasetManager:
    """
    Manages plant disease datasets for ML model training and enrichment.
    Supports incremental dataset uploads, validation, and versioning.
    """
    
    def __init__(self, base_path: str = "./ml-model/dataset"):
        self.base_path = Path(base_path)
        self.metadata_file = self.base_path / "dataset_metadata.json"
        self.versions_dir = self.base_path / "versions"
        self.staging_dir = self.base_path / "staging"
        
        # Create necessary directories
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.versions_dir.mkdir(exist_ok=True)
        self.staging_dir.mkdir(exist_ok=True)
        
        # Load or initialize metadata
        self.metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict:
        """Load dataset metadata from disk"""
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r') as f:
                return json.load(f)
        return {
            "versions": [],
            "classes": {},
            "total_images": 0,
            "last_updated": None,
            "data_quality": {}
        }
    
    def _save_metadata(self):
        """Save dataset metadata to disk"""
        self.metadata["last_updated"] = datetime.now().isoformat()
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=2)
    
    def validate_image(self, image_path: str) -> Tuple[bool, Optional[str], Dict]:
        """
        Validate image quality and return metrics
        Returns: (is_valid, error_message, quality_metrics)
        """
        try:
            img = Image.open(image_path)
            
            # Check format
            if img.format not in ['JPEG', 'JPG', 'PNG']:
                return False, "Invalid format. Only JPEG/PNG allowed", {}
            
            # Check dimensions
            width, height = img.size
            if width < 224 or height < 224:
                return False, f"Image too small. Minimum 224x224, got {width}x{height}", {}
            
            # Check file size (max 10MB)
            file_size = os.path.getsize(image_path) / (1024 * 1024)  # MB
            if file_size > 10:
                return False, f"File too large. Maximum 10MB, got {file_size:.2f}MB", {}
            
            # Calculate blur score (Laplacian variance)
            img_array = np.array(img.convert('L'))
            laplacian_var = self._calculate_blur_score(img_array)
            
            # Calculate brightness
            brightness = np.mean(img_array)
            
            # Calculate contrast
            contrast = np.std(img_array)
            
            quality_metrics = {
                "width": width,
                "height": height,
                "file_size_mb": round(file_size, 2),
                "blur_score": round(laplacian_var, 2),
                "brightness": round(brightness, 2),
                "contrast": round(contrast, 2),
                "is_blurry": laplacian_var < 100,  # Threshold for blur detection
                "is_too_dark": brightness < 50,
                "is_too_bright": brightness > 200
            }
            
            # Overall quality check
            if quality_metrics["is_blurry"]:
                return False, "Image is too blurry", quality_metrics
            
            if quality_metrics["is_too_dark"] or quality_metrics["is_too_bright"]:
                return False, "Image lighting is poor", quality_metrics
            
            return True, None, quality_metrics
            
        except Exception as e:
            return False, f"Failed to process image: {str(e)}", {}
    
    def _calculate_blur_score(self, gray_image: np.ndarray) -> float:
        """Calculate blur score using Laplacian variance"""
        laplacian = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]])
        filtered = np.abs(np.convolve(gray_image.flatten(), laplacian.flatten(), mode='same'))
        return float(np.var(filtered))
    
    def calculate_image_hash(self, image_path: str) -> str:
        """Calculate perceptual hash to detect duplicates"""
        try:
            img = Image.open(image_path).convert('L').resize((8, 8), Image.Resampling.LANCZOS)
            pixels = list(img.getdata())
            avg = sum(pixels) / len(pixels)
            bits = ''.join(['1' if pixel > avg else '0' for pixel in pixels])
            return hex(int(bits, 2))[2:].zfill(16)
        except:
            return None
    
    def detect_duplicate(self, image_hash: str, threshold: int = 5) -> Optional[str]:
        """
        Check if image is a duplicate based on perceptual hash
        Returns path to duplicate if found, None otherwise
        """
        if "image_hashes" not in self.metadata:
            self.metadata["image_hashes"] = {}
        
        # Calculate hamming distance with existing hashes
        for existing_hash, existing_path in self.metadata["image_hashes"].items():
            distance = sum(c1 != c2 for c1, c2 in zip(image_hash, existing_hash))
            if distance <= threshold:
                return existing_path
        
        return None
    
    def add_images_to_staging(
        self, 
        image_files: List[str], 
        class_name: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Add images to staging area with validation
        Returns summary of added/rejected images
        """
        class_dir = self.staging_dir / class_name
        class_dir.mkdir(exist_ok=True)
        
        results = {
            "added": [],
            "rejected": [],
            "duplicates": [],
            "total_attempted": len(image_files)
        }
        
        for img_path in image_files:
            # Validate image
            is_valid, error_msg, quality_metrics = self.validate_image(img_path)
            
            if not is_valid:
                results["rejected"].append({
                    "path": img_path,
                    "reason": error_msg,
                    "metrics": quality_metrics
                })
                continue
            
            # Check for duplicates
            img_hash = self.calculate_image_hash(img_path)
            duplicate_path = self.detect_duplicate(img_hash)
            
            if duplicate_path:
                results["duplicates"].append({
                    "path": img_path,
                    "duplicate_of": duplicate_path
                })
                continue
            
            # Copy to staging with unique filename
            filename = Path(img_path).name
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            new_filename = f"{timestamp}_{filename}"
            dest_path = class_dir / new_filename
            
            shutil.copy2(img_path, dest_path)
            
            # Store image metadata
            img_metadata = {
                "original_path": img_path,
                "class": class_name,
                "added_date": datetime.now().isoformat(),
                "quality_metrics": quality_metrics,
                "hash": img_hash,
                "user_metadata": metadata or {}
            }
            
            # Save metadata alongside image
            metadata_path = dest_path.with_suffix('.json')
            with open(metadata_path, 'w') as f:
                json.dump(img_metadata, f, indent=2)
            
            results["added"].append(str(dest_path))
            
            # Store hash
            if img_hash:
                self.metadata["image_hashes"][img_hash] = str(dest_path)
        
        self._save_metadata()
        return results
    
    def commit_staging_to_dataset(self, version_name: Optional[str] = None) -> Dict:
        """
        Move staging data to main dataset and create new version
        Returns version info
        """
        if not version_name:
            version_name = f"v{len(self.metadata['versions']) + 1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Create version directory
        version_dir = self.versions_dir / version_name
        version_dir.mkdir(exist_ok=True)
        
        # Move staging to version
        staging_classes = [d for d in self.staging_dir.iterdir() if d.is_dir()]
        
        version_stats = {
            "name": version_name,
            "created_at": datetime.now().isoformat(),
            "classes": {},
            "total_images": 0
        }
        
        for class_dir in staging_classes:
            class_name = class_dir.name
            dest_class_dir = version_dir / class_name
            
            # Copy class directory
            shutil.copytree(class_dir, dest_class_dir, dirs_exist_ok=True)
            
            # Count images (exclude metadata files)
            image_count = len([f for f in dest_class_dir.glob("*") if f.suffix.lower() in ['.jpg', '.jpeg', '.png']])
            
            version_stats["classes"][class_name] = {
                "image_count": image_count,
                "path": str(dest_class_dir)
            }
            version_stats["total_images"] += image_count
            
            # Update global class counts
            if class_name not in self.metadata["classes"]:
                self.metadata["classes"][class_name] = {"total_images": 0, "versions": []}
            
            self.metadata["classes"][class_name]["total_images"] += image_count
            self.metadata["classes"][class_name]["versions"].append(version_name)
        
        # Clear staging
        for class_dir in staging_classes:
            shutil.rmtree(class_dir)
        
        # Update metadata
        self.metadata["versions"].append(version_stats)
        self.metadata["total_images"] += version_stats["total_images"]
        self._save_metadata()
        
        return version_stats
    
    def get_dataset_statistics(self) -> Dict:
        """Get comprehensive dataset statistics"""
        stats = {
            "total_versions": len(self.metadata["versions"]),
            "total_images": self.metadata["total_images"],
            "total_classes": len(self.metadata["classes"]),
            "classes": {},
            "data_distribution": {},
            "recent_additions": []
        }
        
        # Per-class stats
        for class_name, class_info in self.metadata["classes"].items():
            stats["classes"][class_name] = {
                "total_images": class_info["total_images"],
                "versions": len(class_info["versions"]),
                "percentage": round((class_info["total_images"] / self.metadata["total_images"]) * 100, 2) if self.metadata["total_images"] > 0 else 0
            }
        
        # Recent versions
        if self.metadata["versions"]:
            stats["recent_additions"] = self.metadata["versions"][-5:]
        
        return stats
    
    def export_training_manifest(self, output_path: str, version: Optional[str] = None) -> str:
        """
        Export training manifest in format ready for model training
        Returns path to manifest file
        """
        if version:
            # Export specific version
            version_data = next((v for v in self.metadata["versions"] if v["name"] == version), None)
            if not version_data:
                raise ValueError(f"Version {version} not found")
            version_dir = self.versions_dir / version
        else:
            # Export latest version
            if not self.metadata["versions"]:
                raise ValueError("No dataset versions available")
            version_data = self.metadata["versions"][-1]
            version_dir = self.versions_dir / version_data["name"]
        
        manifest = {
            "version": version_data["name"],
            "created_at": version_data["created_at"],
            "total_images": version_data["total_images"],
            "num_classes": len(version_data["classes"]),
            "classes": [],
            "images": []
        }
        
        class_to_idx = {}
        
        for idx, (class_name, class_info) in enumerate(version_data["classes"].items()):
            class_to_idx[class_name] = idx
            manifest["classes"].append({
                "id": idx,
                "name": class_name,
                "count": class_info["image_count"]
            })
            
            # List all images in class
            class_dir = Path(class_info["path"])
            for img_file in class_dir.glob("*"):
                if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                    manifest["images"].append({
                        "path": str(img_file.absolute()),
                        "class": class_name,
                        "class_id": idx,
                        "filename": img_file.name
                    })
        
        # Save manifest
        output_file = Path(output_path)
        with open(output_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        return str(output_file)
    
    def get_staging_summary(self) -> Dict:
        """Get summary of images in staging area"""
        staging_classes = [d for d in self.staging_dir.iterdir() if d.is_dir()]
        
        summary = {
            "total_classes": len(staging_classes),
            "total_images": 0,
            "classes": {}
        }
        
        for class_dir in staging_classes:
            image_count = len([f for f in class_dir.glob("*") if f.suffix.lower() in ['.jpg', '.jpeg', '.png']])
            summary["classes"][class_dir.name] = image_count
            summary["total_images"] += image_count
        
        return summary
