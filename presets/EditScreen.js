// File: EditScreen.js

import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';

const ROTATION_ANGLE_DEGREES = 15;
const screenWidth = Dimensions.get('window').width;

const DraggableImage = forwardRef(
  ({ imageUri, slot, isSelected, onSelect, initialTransform = {} }, ref) => {
    const panX = useSharedValue(initialTransform.x || 0);
    const panY = useSharedValue(initialTransform.y || 0);
    const scale = useSharedValue(initialTransform.scale || 1);
    const rotation = useSharedValue(
      ((initialTransform.rotate || 0) * Math.PI) / 180
    );
    const savedPanX = useSharedValue(panX.value);
    const savedPanY = useSharedValue(panY.value);
    const savedScale = useSharedValue(scale.value);
    const savedRotation = useSharedValue(rotation.value);

    const panGesture = Gesture.Pan()
      .onStart(() => runOnJS(onSelect)())
      .onUpdate((e) => {
        panX.value = savedPanX.value + e.translationX;
        panY.value = savedPanY.value + e.translationY;
      })
      .onEnd(() => {
        savedPanX.value = panX.value;
        savedPanY.value = panY.value;
      });

    const pinchGesture = Gesture.Pinch()
      .onUpdate((e) => {
        scale.value = savedScale.value * e.scale;
      })
      .onEnd(() => {
        savedScale.value = scale.value;
      });

    const rotationGesture = Gesture.Rotation()
      .onUpdate((e) => {
        rotation.value = savedRotation.value + e.rotation;
      })
      .onEnd(() => {
        savedRotation.value = rotation.value;
      });

    const composedGesture = Gesture.Simultaneous(
      panGesture,
      pinchGesture,
      rotationGesture
    );

    const animatedStyle = useAnimatedStyle(() => ({
      position: 'absolute',
      left: slot.x,
      top: slot.y,
      width: slot.width,
      height: slot.height,
      borderRadius: 8,
      borderWidth: isSelected ? 2 : 0,
      borderColor: '#007aff',
      transform: [
        { translateX: panX.value },
        { translateY: panY.value },
        { scale: scale.value },
        { rotate: `${(rotation.value * 180) / Math.PI}deg` },
      ],
    }));

    useImperativeHandle(ref, () => ({
      reset() {
        panX.value = withTiming(0);
        panY.value = withTiming(0);
        scale.value = withTiming(1);
        rotation.value = withTiming(0);
        savedPanX.value = 0;
        savedPanY.value = 0;
        savedScale.value = 1;
        savedRotation.value = 0;
      },
      rotate(direction) {
        const newRotation =
          savedRotation.value +
          (direction * ROTATION_ANGLE_DEGREES * Math.PI) / 180;
        rotation.value = withTiming(newRotation);
        savedRotation.value = newRotation;
      },
    }));

    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedStyle}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
            resizeMode="cover"
          />
        </Animated.View>
      </GestureDetector>
    );
  }
);

export default function EditScreen({ navigation, route }) {
  const { selectedPreset, userImages: initialUserImages } = route.params || {};

  const userImages = useMemo(() => {
    if (!initialUserImages) return [];
    if (typeof initialUserImages[0] === 'string') {
      return initialUserImages.map((uri) => ({ uri }));
    }
    return initialUserImages;
  }, [initialUserImages]);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const imageRefs = useMemo(
    () =>
      Array(userImages.length)
        .fill(0)
        .map(() => React.createRef()),
    [userImages.length]
  );
  const viewShotRef = useRef();

  const containerWidth = screenWidth * 0.9;
  const originalWidth = selectedPreset?.originalWidth || 350;
  const originalHeight = selectedPreset?.originalHeight || 824;
  const aspectRatio = originalHeight / originalWidth;
  const containerHeight = containerWidth * aspectRatio;

  const handleSave = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      console.log('Captured URI:', uri);
      if (!uri) throw new Error('URI capture failed');
      navigation.navigate('PreviewScreen', { capturedUri: uri });
    } catch (error) {
      console.error('Capture failed', error);
      Alert.alert('Lỗi', 'Không thể tạo ảnh. Vui lòng thử lại.');
    }
  };

  if (!selectedPreset || userImages.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>🚫 Không có dữ liệu để chỉnh sửa.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text>← Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 16,
          }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text>Huỷ</Text>
          </TouchableOpacity>
          <Text>Chỉnh sửa</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={{ fontWeight: 'bold' }}>Lưu</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View
              style={{
                width: containerWidth,
                height: containerHeight,
                position: 'relative',
                backgroundColor: '#eee',
              }}>
              collapsable={false}
              {userImages.map((image, index) => {
                const slot = selectedPreset.slots[index];
                if (!slot) return null;
                return (
                  <DraggableImage
                    key={image.uri || index}
                    ref={imageRefs[index]}
                    imageUri={image.uri}
                    slot={{
                      x: slot.x * (containerWidth / originalWidth),
                      y: slot.y * (containerWidth / originalWidth),
                      width: slot.width * (containerWidth / originalWidth),
                      height: slot.height * (containerWidth / originalWidth),
                    }}
                    isSelected={selectedIndex === index}
                    onSelect={() => setSelectedIndex(index)}
                    initialTransform={image.transform}
                  />
                );
              })}
              <Image
                source={selectedPreset.image}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: containerWidth,
                  height: containerHeight,
                }}
                resizeMode="contain"
                pointerEvents="none"
              />
            </View>
          </ViewShot>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            padding: 10,
          }}>
          <TouchableOpacity
            onPress={() => imageRefs[selectedIndex]?.current?.reset()}
            disabled={selectedIndex === null}>
            <Text>🔄 Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => imageRefs[selectedIndex]?.current?.rotate(-1)}
            disabled={selectedIndex === null}>
            <Text>↶ Trái</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => imageRefs[selectedIndex]?.current?.rotate(1)}
            disabled={selectedIndex === null}>
            <Text>↷ Phải</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedIndex(null)}
            disabled={selectedIndex === null}>
            <Text>❌ Bỏ chọn</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
