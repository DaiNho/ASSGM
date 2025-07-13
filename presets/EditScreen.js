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
const screenHeight = Dimensions.get('window').height;

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

  const containerWidth = screenWidth * 0.85;
  const originalWidth = selectedPreset?.originalWidth || 350;
  const originalHeight = selectedPreset?.originalHeight || 824;
  const aspectRatio = originalHeight / originalWidth;
  const containerHeight = containerWidth * aspectRatio;

  const maxContainerHeight = screenHeight * 0.55;
  const finalContainerHeight = Math.min(containerHeight, maxContainerHeight);
  const finalContainerWidth = aspectRatio > 1 ? finalContainerHeight / aspectRatio : containerWidth;

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
      <SafeAreaView style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>🚫 Không có dữ liệu để chỉnh sửa.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Huỷ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, styles.saveButton]}>Lưu</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.editingArea}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View
              style={[
                styles.canvas,
                {
                  width: finalContainerWidth,
                  height: finalContainerHeight,
                }
              ]}
              collapsable={false}
            >
              {userImages.map((image, index) => {
                const slot = selectedPreset.slots[index];
                if (!slot) return null;
                return (
                  <DraggableImage
                    key={image.uri || index}
                    ref={imageRefs[index]}
                    imageUri={image.uri}
                    slot={{
                      x: slot.x * (finalContainerWidth / originalWidth),
                      y: slot.y * (finalContainerWidth / originalWidth),
                      width: slot.width * (finalContainerWidth / originalWidth),
                      height: slot.height * (finalContainerWidth / originalWidth),
                    }}
                    isSelected={selectedIndex === index}
                    onSelect={() => setSelectedIndex(index)}
                    initialTransform={image.transform}
                  />
                );
              })}
              <Image
                source={selectedPreset.image}
                style={[
                  styles.frameImage,
                  {
                    width: finalContainerWidth,
                    height: finalContainerHeight,
                  }
                ]}
                resizeMode="contain"
                pointerEvents="none"
              />
            </View>
          </ViewShot>
        </View>

        {/* Control buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, selectedIndex === null && styles.disabledButton]}
            onPress={() => imageRefs[selectedIndex]?.current?.reset()}
            disabled={selectedIndex === null}
          >
            <Text style={[styles.controlButtonText, selectedIndex === null && styles.disabledText]}>
              🔄 Reset
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, selectedIndex === null && styles.disabledButton]}
            onPress={() => imageRefs[selectedIndex]?.current?.rotate(-1)}
            disabled={selectedIndex === null}
          >
            <Text style={[styles.controlButtonText, selectedIndex === null && styles.disabledText]}>
              ↶ Trái
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, selectedIndex === null && styles.disabledButton]}
            onPress={() => imageRefs[selectedIndex]?.current?.rotate(1)}
            disabled={selectedIndex === null}
          >
            <Text style={[styles.controlButtonText, selectedIndex === null && styles.disabledText]}>
              ↷ Phải
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, selectedIndex === null && styles.disabledButton]}
            onPress={() => setSelectedIndex(null)}
            disabled={selectedIndex === null}
          >
            <Text style={[styles.controlButtonText, selectedIndex === null && styles.disabledText]}>
              ❌ Bỏ chọn
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            {selectedIndex !== null 
              ? `Đang chỉnh sửa ảnh ${selectedIndex + 1}. Kéo để di chuyển, véo để thu/phóng, xoay để quay.`
              : 'Chạm vào ảnh để chọn và chỉnh sửa'
            }
          </Text>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#007bff',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  saveButton: {
    fontWeight: 'bold',
    color: '#28a745',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  editingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 20,
  },
  canvas: {
    position: 'relative',
    backgroundColor: '#eee',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  frameImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007bff',
    minWidth: 70,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  disabledText: {
    color: '#6c757d',
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  instructionsText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});