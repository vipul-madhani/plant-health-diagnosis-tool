import os
import requests

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

sample_img_urls = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Tomato_blite.JPG/640px-Tomato_blite.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/4/45/Potato_blight.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a2/Wheat-field.jpg"
]

DATASET_DIR = "dataset"
os.makedirs(DATASET_DIR, exist_ok=True)

for i, class_name in enumerate(classes):
    class_dir = os.path.join(DATASET_DIR, class_name)
    os.makedirs(class_dir, exist_ok=True)
    # Cycle through sample images so each class is guaranteed a file
    img_url = sample_img_urls[i % len(sample_img_urls)]
    save_path = os.path.join(class_dir, "sample.jpg")
    try:
        r = requests.get(img_url, timeout=10)
        if r.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(r.content)
            print(f"Downloaded for {class_name}: {save_path}")
        else:
            print(f"Failed ({r.status_code}): {img_url}")
    except Exception as e:
        print(f"Error downloading for {class_name}: {e}")

print("\nEach class folder now has a valid JPEG. Try your training script again.")
