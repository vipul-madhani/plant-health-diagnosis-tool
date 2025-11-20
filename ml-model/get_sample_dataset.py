import os
import requests

# Sample image URLs (PlantVillage, Wikimedia, etc.)
sample_images = {
    "Tomato_Blight": [
        "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___Late_blight/7c75fe32-8946-45fd-b464-6d2ad2af63cf___Tomato.Late_blight_3047.JPG",
        "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___Late_blight/9d407b95-b4c4-4d14-8c1d-f160a9e4c5e3___Tomato.Late_blight_3213.JPG"
    ],
    "Tomato_Healthy": [
        "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___healthy/0a4be47c-6825-46cd-b3c7-42b4ef7de357___Tomato.healthy_06.JPG"
    ],
    "Potato_LateBlight": [
        "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Potato___Late_blight/367da79b-7f7c-43b3-894c-e3625d99b3e2___Potato.Late_blight_8575.JPG"
    ],
    "Potato_Healthy": [
        "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Potato___healthy/009b9413-ab16-46bf-9b8f-722c2f01cf09___Potato.healthy_095.JPG"
    ],
    "Wheat_Rust": [
        "https://upload.wikimedia.org/wikipedia/commons/6/6e/Wheat_leaf_rust_%28Puccinia_triticina%29_symptoms.jpg"
    ],
    "Wheat_Healthy": [
        "https://upload.wikimedia.org/wikipedia/commons/3/37/Wheat_field_in_Punjab%2C_India.JPG"
    ]
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
        file_ext = url.split('.')[-1].split('?')[0]
        save_path = os.path.join(class_dir, f"sample_{i+1}.{file_ext}")
        download_image(url, save_path)

print("\nFinished downloading samples. You can now run your training script.")
