// File: App.js
import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./HomeScreen";
import PresetsScreen from "./presets/presetsScreen";
import EditScreen from "./presets/EditScreen";
import PreviewScreen from "./presets/PreviewScreen";
import AIScreen from "./presets/AIEnhanceScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [isShooting, setIsShooting] = useState(false);

  // ✅ Xin quyền camera và thư viện ảnh khi app khởi động
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || mediaStatus !== "granted") {
        Alert.alert(
          "Thiếu quyền truy cập",
          "Vui lòng cấp quyền truy cập Camera và Thư viện để sử dụng ứng dụng."
        );
      }
    };

    requestPermissions();
  }, []);

  // ✅ Tính aspect ratio của slot
  const getSlotAspectRatio = (slot) => {
    return slot.width / slot.height;
  };

  // ✅ Chụp ảnh với crop theo tỷ lệ slot
  const takePhotoWithCrop = async (index) => {
    if (!selectedPreset || !selectedPreset.slots[index]) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin slot");
      return;
    }

    const slot = selectedPreset.slots[index];
    const aspectRatio = getSlotAspectRatio(slot);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [slot.width, slot.height], // Tỷ lệ crop theo slot
      quality: 1,
    });

    if (!result.canceled) {
      const newUri = result.assets[0].uri;
      setUserImages((prev) => {
        const updated = [...prev];
        updated[index] = newUri;
        return updated;
      });
    }
  };

  // ✅ Chọn ảnh từ thư viện với crop
  const handleSelectImageWithCrop = async (index) => {
    if (!selectedPreset || !selectedPreset.slots[index]) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin slot");
      return;
    }

    const slot = selectedPreset.slots[index];

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [slot.width, slot.height], // Tỷ lệ crop theo slot
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const updated = [...userImages];
      updated[index] = uri;
      setUserImages(updated);
    }
  };

  // ✅ Chọn nhiều ảnh với crop tự động
  const pickMultipleImagesWithCrop = async () => {
    if (!selectedPreset) {
      Alert.alert("Lỗi", "Vui lòng chọn preset trước");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      // Không thể set aspect ratio cho multiple selection
      // Sẽ cần crop từng ảnh một sau khi chọn
    });

    if (!result.canceled) {
      const selected = result.assets;
      const updated = [...userImages];

      // Crop từng ảnh theo slot tương ứng
      let selectedIndex = 0;
      for (
        let i = 0;
        i < updated.length && selectedIndex < selected.length;
        i++
      ) {
        if (!updated[i]) {
          // Crop ảnh theo slot
          const slot = selectedPreset.slots[i];
          if (slot) {
            // Lưu ảnh tạm thời và crop sau
            updated[i] = selected[selectedIndex].uri;
            selectedIndex++;
          }
        }
      }

      setUserImages(updated);

      // Thông báo để user biết có thể cần crop thêm
      Alert.alert(
        "Thông báo",
        "Ảnh đã được thêm. Bạn có thể chỉnh sửa từng ảnh để phù hợp với khung."
      );
    }
  };

  // ✅ Chụp ảnh tự động với crop
  const autoCaptureForSlotsWithCrop = async (index) => {
    if (!selectedPreset || index >= selectedPreset.slots.length) {
      setCurrentSlotIndex(null);
      alert("✅ Đã chụp xong tất cả ảnh!");
      return;
    }

    setCurrentSlotIndex(index);
    setCountdown(3);
    setIsShooting(true);

    const interval = setInterval(async () => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(3);
          setIsShooting(false);
          (async () => {
            await takePhotoWithCrop(index);
            autoCaptureForSlotsWithCrop(index + 1);
          })();
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ✅ Giữ lại hàm cũ cho tương thích ngược
  const pickMultipleImages = pickMultipleImagesWithCrop;
  const takePhoto = takePhotoWithCrop;
  const handleSelectImage = handleSelectImageWithCrop;
  const autoCaptureForSlots = autoCaptureForSlotsWithCrop;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AIScreen"
          component={AIScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Preset" options={{ title: "Khung mẫu" }}>
          {(props) => (
            <PresetsScreen
              {...props}
              selectedPreset={selectedPreset}
              setSelectedPreset={setSelectedPreset}
              userImages={userImages}
              setUserImages={setUserImages}
              pickMultipleImages={pickMultipleImages}
              autoCaptureForSlots={autoCaptureForSlots}
              takePhoto={takePhoto}
              countdown={countdown}
              isShooting={isShooting}
              setIsShooting={setIsShooting}
              handleSelectImage={handleSelectImage}
              // Thêm các hàm mới
              takePhotoWithCrop={takePhotoWithCrop}
              handleSelectImageWithCrop={handleSelectImageWithCrop}
              getSlotAspectRatio={getSlotAspectRatio}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="EditScreen"
          component={EditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PreviewScreen"
          component={PreviewScreen}
          options={{ title: "Xem trước ảnh" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
