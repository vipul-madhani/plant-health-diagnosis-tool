#!/usr/bin/env python3
"""
Plant Disease Classification - Modular Training Script
Supports MobileNetV2, EfficientNet, and ResNet
"""
import os
import tensorflow as tf
from tensorflow import keras

def get_preprocessing_image(height=224, width=224):
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
    x = get_preprocessing_image()(inputs)
    x = base_model(x, training=False)
    x = keras.layers.GlobalAveragePooling2D()(x)
    x = keras.layers.Dropout(0.2)(x)
    outputs = keras.layers.Dense(num_classes, activation='softmax')(x)
    model = keras.Model(inputs, outputs)
    return model

def main():
    DATASET_DIR = 'dataset'
    MODEL_TYPE = os.getenv('MODEL_TYPE', 'MobileNetV2')
    IMG_SIZE = (224, 224)
    NUM_CLASSES = 5

    model = build_model(MODEL_TYPE, input_shape=IMG_SIZE + (3,), num_classes=NUM_CLASSES)
    model.summary()
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    # Data loading and augmentation goes here
    # model.fit(...)
    model.save(f'models/{MODEL_TYPE.lower()}_plant_model.h5')

if __name__ == '__main__':
    main()
