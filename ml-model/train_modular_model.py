import os
import tensorflow as tf
from tensorflow import keras

DATASET_DIR = 'dataset'
MODEL_TYPE = os.getenv('MODEL_TYPE', 'MobileNetV2')  # or EfficientNetB0, ResNet50
BATCH_SIZE = 32
IMG_SIZE = (224, 224)
EPOCHS = 25

# Dynamically infer classes
train_ds = keras.preprocessing.image_dataset_from_directory(
    DATASET_DIR,
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)
val_ds = keras.preprocessing.image_dataset_from_directory(
    DATASET_DIR,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)
class_names = train_ds.class_names
NUM_CLASSES = len(class_names)

# Data augmentation
data_augmentation = keras.Sequential([
    keras.layers.RandomFlip("horizontal_and_vertical"),
    keras.layers.RandomRotation(0.2),
])

def get_preprocessing(height=224, width=224):
    return keras.Sequential([
        keras.layers.Resizing(height, width),
        keras.layers.Rescaling(1./255)
    ])

def build_model(model_name='MobileNetV2', input_shape=(224,224,3), num_classes=5):
    if model_name.lower() == 'mobilenetv2':
        base_model = keras.applications.MobileNetV2(input_shape=input_shape, include_top=False, weights='imagenet')
    elif model_name.lower() == 'efficientnetb0':
        base_model = keras.applications.EfficientNetB0(input_shape=input_shape, include_top=False, weights='imagenet')
    elif model_name.lower() == 'resnet50':
        base_model = keras.applications.ResNet50(input_shape=input_shape, include_top=False, weights='imagenet')
    else:
        raise ValueError('Unsupported model name')
    base_model.trainable = False
    inputs = keras.Input(shape=input_shape)
    x = data_augmentation(inputs)
    x = get_preprocessing()(x)
    x = base_model(x, training=False)
    x = keras.layers.GlobalAveragePooling2D()(x)
    x = keras.layers.Dropout(0.2)(x)
    outputs = keras.layers.Dense(num_classes, activation='softmax')(x)
    model = keras.Model(inputs, outputs)
    return model

model = build_model(MODEL_TYPE, input_shape=IMG_SIZE + (3,), num_classes=NUM_CLASSES)
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS
)

model.save(f"models/{MODEL_TYPE.lower()}_plant_model.h5")

print(f"\nClasses learned: {class_names}")

