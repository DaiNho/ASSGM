import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
export default function PreviewScreen({ route, navigation }) {
  const capturedUri = route?.params?.capturedUri;

  if (!capturedUri) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>❌ Không tìm thấy ảnh đã chụp.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Quay lại chỉnh sửa</Text>
        </TouchableOpacity>
      </View>
    );
  }

 const handleSaveToGallery = async () => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Thiếu quyền', 'Ứng dụng cần quyền để lưu ảnh.');
    return;
  }

  try {
    const asset = await MediaLibrary.createAssetAsync(capturedUri);
    await MediaLibrary.createAlbumAsync('Saved from App', asset, false);
    Alert.alert('Thành công', 'Ảnh đã được lưu vào thư viện!');
  } catch (error) {
    console.error('Save error:', error);
    Alert.alert('Lỗi', 'Không thể lưu ảnh. Vui lòng thử lại.');
  }
};

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: capturedUri }}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSaveToGallery}>
          <Text style={styles.buttonText}>📥 Lưu về máy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.outline]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>🔄 Chỉnh sửa lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
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
  image: {
    width: '100%',
    height: '80%',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  outline: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});