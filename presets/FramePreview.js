// File: FramePreview.js
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function FramePreview({
  preset,
  userImages,
  editedImages,
  containerWidth = screenWidth * 0.85,
}) {
  if (!preset || !userImages) return null;

  const originalWidth = preset.originalWidth || 350;
  const originalHeight = preset.originalHeight || 824;

  const aspectRatio = originalHeight / originalWidth;
  const containerHeight = containerWidth * aspectRatio;
  const scaleBase = containerWidth / originalWidth;

  const imagesToDisplay = editedImages || userImages;

  return (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      <Image source={preset.image} style={{ width: containerWidth, height: containerHeight }} resizeMode="cover" />

      {imagesToDisplay.map((imageData, index) => {
  if (!imageData || !preset.slots[index]) return null;

  const slot = preset.slots[index];

  const imageUri = typeof imageData === 'string' ? imageData : imageData.uri;
  const transform = imageData.transform || {};

  if (!imageUri) return null;

  const baseLeft = slot.x * scaleBase;
  const baseTop = slot.y * scaleBase;
  const width = slot.width * scaleBase;
  const height = slot.height * scaleBase;

  const offsetX = (transform.x || 0) * scaleBase;
  const offsetY = (transform.y || 0) * scaleBase;

  const finalLeft = baseLeft + offsetX;
  const finalTop = baseTop + offsetY;

  return (
    <Image
      key={`user-image-${index}`}
      source={{ uri: imageUri }}
      style={{
        position: 'absolute',
        left: finalLeft,
        top: finalTop,
        width,
        height,
        borderRadius: 4,
        transform: [
          { scale: transform.scale || 1 },
          { rotate: `${transform.rotate || 0}deg` },
        ],
      }}
      resizeMode="cover"
    />
  );
})}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
});
