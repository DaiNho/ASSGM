import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GestureHandlerRootView, PinchGestureHandler, RotationGestureHandler } from 'react-native-gesture-handler';

const screenWidth = Dimensions.get('window').width;

const frameData = {
  id: 1,
  name: 'Classic Frame',
  image: require('../assets/1.png'),
  width: 345,
  height: 838,
  slots: [
    { id: 0, x: 25, y: 60, width: 295, height: 195 },
    { id: 1, x: 25, y: 295, width: 295, height: 195 },
    { id: 2, x: 25, y: 530, width: 295, height: 195 },
  ],
};

export default function InteractiveFrameEditor() {
  const [userImages, setUserImages] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [transforms, setTransforms] = useState({}); // { slotIndex: { scale, rotate, translateX, translateY } }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.cancelled && selectedSlot !== null) {
      const newImages = [...userImages];
      newImages[selectedSlot] = result.uri;
      setUserImages(newImages);

      setTransforms((prev) => ({
        ...prev,
        [selectedSlot]: { scale: 1, rotate: 0, translateX: 0, translateY: 0 },
      }));
    }
  };

  const renderSlot = (slot, index) => {
    const transform = transforms[index] || { scale: 1, rotate: 0, translateX: 0, translateY: 0 };
    const image = userImages[index];

    return (
      <View
        key={index}
        style={[
          styles.slot,
          {
            left: slot.x,
            top: slot.y,
            width: slot.width,
            height: slot.height,
          },
        ]}
      >
        {image && (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RotationGestureHandler
              onGestureEvent={(event) => {
                setTransforms((prev) => ({
                  ...prev,
                  [index]: { ...transform, rotate: event.nativeEvent.rotation },
                }));
              }}
            >
              <PinchGestureHandler
                onGestureEvent={(event) => {
                  setTransforms((prev) => ({
                    ...prev,
                    [index]: { ...transform, scale: event.nativeEvent.scale },
                  }));
                }}
              >
                <Image
                  source={{ uri: image }}
                  style={{
                    width: slot.width,
                    height: slot.height,
                    resizeMode: 'cover',
                    transform: [
                      { translateX: transform.translateX },
                      { translateY: transform.translateY },
                      { scale: transform.scale },
                      { rotate: `${transform.rotate}rad` },
                    ],
                  }}
                />
              </PinchGestureHandler>
            </RotationGestureHandler>
          </GestureHandlerRootView>
        )}

        {!image && (
          <TouchableOpacity
            onPress={() => {
              setSelectedSlot(index);
              pickImage();
            }}
            style={styles.emptySlot}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          width: frameData.width,
          height: frameData.height,
          position: 'relative',
        }}
      >
        {userImages.map((_, index) => renderSlot(frameData.slots[index], index))}

        <Image
          source={frameData.image}
          style={{
            width: frameData.width,
            height: frameData.height,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 50,
  },
  slot: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#ddd',
  },
  emptySlot: {
    flex: 1,
    backgroundColor: '#ccc',
  },
});
