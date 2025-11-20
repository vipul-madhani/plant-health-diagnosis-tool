import os

# List your global classes here (customize as needed!)
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

dataset_dir = "dataset"
os.makedirs(dataset_dir, exist_ok=True)

for class_name in classes:
    class_path = os.path.join(dataset_dir, class_name)
    os.makedirs(class_path, exist_ok=True)
    print(f"Created folder: {class_path}")

print("\nPlace your labeled images (jpg/png) in each folder and rerun the training script!")
