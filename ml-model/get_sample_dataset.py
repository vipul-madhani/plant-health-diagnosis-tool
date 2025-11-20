import os
import requests

sample_images = {
    "Tomato_Healthy": [
        "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80"
    ],
    "Tomato_Blight": [
        "https://plantvillage.psu.edu/image/show/485"
    ],
    "Wheat_Healthy": [
        "https://images.unsplash.com/photo-1518977956810-8fbc8d6d7337?auto=format&fit=crop&w=400&q=80"
    ],
    "Wheat_Rust": [
        "https://www.cabi.org/isc/Images/isc/RPU/RPU5015.jpg"
    ]
    # add more URLs for other classes if needed, using direct JPEG/PNG links!
}

DATASET_DIR = "dataset"
os.makedirs(DATASET_DIR, exist_ok=True)

def download_image(url, save_path):
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(r.content)
            print(f"Downloaded: {save_path}")
        else:
            print(f"Failed ({r.status_code}): {url}")
    except Exception as e:
        print(f"Error ({url}): {e}")

for class_name, urls in sample_images.items():
    class_dir = os.path.join(DATASET_DIR, class_name)
    os.makedirs(class_dir, exist_ok=True)
    for i, url in enumerate(urls):
        save_path = os.path.join(class_dir, f"sample_{i+1}.jpg")
        download_image(url, save_path)

print("\nFinished downloading samples! Now run your training script.")
