// File: FramePreview.js
import React from 'react';
import { View, Image, StyleSheet, ImageBackground } from 'react-native';

const FakeLinearGradient = ({ colors, children, style }) => (
  <View style={[style, { backgroundColor: colors[0] || '#ccc' }]}>
    {colors && colors[1] && (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors[1], opacity: 0.6 },
        ]}
      />
    )}
    {children}
  </View>
);

export default function FramePreview({ preset, userImages, containerWidth }) {
  if (!preset) return null;

  const imagesToDisplay = userImages || [];

  const originalWidth = preset.originalWidth || 350;
  const originalHeight = preset.originalHeight || 824;
  const aspectRatio = originalHeight / originalWidth;
  const containerHeight = containerWidth * aspectRatio;
  const scale = containerWidth / originalWidth;

  const FrameComponent = preset.isAIGenerated
    ? FakeLinearGradient
    : ImageBackground;

  const frameProps = preset.isAIGenerated
    ? { colors: preset.colors, style: styles.fullSize }
    : { source: preset.image, style: styles.fullSize, resizeMode: 'contain' };

  return (
    <View style={{ width: containerWidth, height: containerHeight }}>
      <FrameComponent {...frameProps}>
        {imagesToDisplay.map((imageData, index) => {
          const slot = preset.slots[index];
          if (!imageData || !slot) return null;

          const imageUri = typeof imageData === 'string' ? imageData : imageData.uri;
          const transform = imageData.transform || {};

          if (!imageUri) return null;

          const finalLeft = (slot.x + (transform.x || 0)) * scale;
          const finalTop = (slot.y + (transform.y || 0)) * scale;

          return (
            <Image
              key={`user-image-${index}`}
              source={{ uri: imageUri }}
              style={{
                position: 'absolute',
                left: finalLeft,
                top: finalTop,
                width: slot.width * scale,
                height: slot.height * scale,
                transform: [
                  { scale: transform.scale || 1 },
                  { rotate: `${transform.rotate || 0}deg` },
                ],
              }}
              resizeMode="cover"
            />
          );
        })}
      </FrameComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  fullSize: {
    width: '100%',
    height: '100%',
  },
});
