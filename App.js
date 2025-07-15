// File: App.js
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './HomeScreen';
import PresetsScreen from './presets/presetsScreen';
import EditScreen from './presets/EditScreen';
import PreviewScreen from './presets/PreviewScreen';
import AIScreen from './presets/AIEnhanceScreen';
const Stack = createNativeStackNavigator();
//....
export default function App() {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [isShooting, setIsShooting] = useState(false);

  const pickMultipleImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const updated = [...userImages];
      const selected = result.assets;

      let selectedIndex = 0;
      for (let i = 0; i < updated.length; i++) {
        if (!updated[i] && selectedIndex < selected.length) {
          updated[i] = selected[selectedIndex].uri;
          selectedIndex++;
        }
      }

      setUserImages(updated);
    }
  };

  const takePhoto = async (index) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const handleSelectImage = async (index) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const updated = [...userImages];
      updated[index] = uri;
      setUserImages(updated);
    }
  };

  const autoCaptureForSlots = async (index) => {
    if (index >= selectedPreset.slots.length) {
      setCurrentSlotIndex(null);
      alert('✅ Đã chụp xong tất cả ảnh!');
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
            await takePhoto(index);
            autoCaptureForSlots(index + 1);
          })();
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="AIScreen"
          component={AIScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Preset" options={{ title: 'Khung mẫu' }}>
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
          options={{ title: 'Xem trước ảnh' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
