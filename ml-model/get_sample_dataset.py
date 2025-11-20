import os
import requests

IMG_URL = "https://images.unsplash.com/photo-1518977956810-8fbc8d6d7337?auto=format&fit=crop&w=400&q=80" # Example wheat image

classes = [
    "Tomato_Blight",
    "Tomato_Healthy",
    "Potato_LateBlight",
    "Potato_Healthy",
    "Rice_BacterialLeafBlight",
    "Rice_Healthy",
    "Wheat_Rust",
    "Wheat_Healthy",
    "Maize_LeafSpot",
    "Maize_Healthy",
    "Leaf_Healthy",
    "Leaf_Disease",
    "General_Unknown"
]

DATASET_DIR = "dataset"
os.makedirs(DATASET_DIR, exist_ok=True)

for class_name in classes:
    class_dir = os.path.join(DATASET_DIR, class_name)
    os.makedirs(class_dir, exist_ok=True)
    save_path = os.path.join(class_dir, "sample.jpg")
    try:
        r = requests.get(IMG_URL, timeout=10)
        if r.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(r.content)
            print(f"Downloaded: {save_path}")
    except Exception as e:
        print(f"Error downloading for {class_name}: {e}")

print("\nThis will give you 1 image per class (same image for test purposes). Now run your training script.")
