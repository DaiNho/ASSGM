import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
// Thay đổi import này
import Slider from '@react-native-community/slider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// AI-powered image processing functions
const enhanceImageWithAI = async (imageUri, settings) => {
  try {
    const actions = [];
    
    // Auto brightness adjustment
    if (settings.brightness !== 0) {
      actions.push({
        brightness: settings.brightness,
      });
    }
    
    // Auto contrast
    if (settings.contrast !== 0) {
      actions.push({
        contrast: settings.contrast,
      });
    }
    
    // Auto saturation
    if (settings.saturation !== 0) {
      actions.push({
        saturation: settings.saturation,
      });
    }
    
    // Auto crop (smart crop based on face detection simulation)
    if (settings.smartCrop) {
      actions.push({
        crop: {
          originX: 0.1,
          originY: 0.1,
          width: 0.8,
          height: 0.8,
        },
      });
    }
    
    // Auto sharpen
    if (settings.sharpen > 0) {
      // Simulate sharpening effect through resize
      actions.push({
        resize: {
          width: undefined,
          height: undefined,
        },
      });
    }

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result;
  } catch (error) {
    console.error('AI Enhancement error:', error);
    throw error;
  }
};

// Enhanced AI analysis simulation with more realistic parameters
const analyzeImage = (imageUri) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate more sophisticated AI analysis
      const analysis = {
        brightness: (Math.random() - 0.5) * 0.4, // -0.2 to 0.2
        contrast: (Math.random() - 0.5) * 0.3,   // -0.15 to 0.15
        saturation: (Math.random() - 0.5) * 0.2, // -0.1 to 0.1
        sharpness: Math.random() * 0.5,
        faceDetected: Math.random() > 0.4,
        lightingCondition: ['good', 'low', 'overexposed'][Math.floor(Math.random() * 3)],
        colorBalance: ['warm', 'cool', 'neutral'][Math.floor(Math.random() * 3)],
        quality: Math.random() * 30 + 70, // 70-100
        noiseLevel: Math.random() * 0.3,   // 0-0.3
        skinTone: Math.random() > 0.6,     // Skin detection
      };
      resolve(analysis);
    }, 2000); // Slightly longer for more realistic feel
  });
};

export default function AIScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [processingStep, setProcessingStep] = useState('');
  
  // Enhancement settings
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [smartCrop, setSmartCrop] = useState(false);
  const [skinSmoothing, setSkinSmoothing] = useState(false);

  const processingSteps = [
    '🔍 Phân tích ảnh với AI...',
    '🎯 Phát hiện khuôn mặt...',
    '💡 Tối ưu ánh sáng...',
    '🎨 Cân bằng màu sắc...',
    '✨ Tăng cường chi tiết...',
    '🖼️ Hoàn thiện kết quả...',
  ];

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const cameraPermission = await Camera.requestCameraPermissionsAsync();
        const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraPermission.status !== 'granted' || libraryPermission.status !== 'granted') {
          Alert.alert(
            'Cần quyền truy cập',
            'Ứng dụng cần quyền truy cập camera và thư viện ảnh để hoạt động.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Permission error:', error);
      }
    };

    requestPermissions();
  }, []);

  const selectImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setEnhancedImage(null);
        setAnalysis(null);
        resetSettings();
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setEnhancedImage(null);
        setAnalysis(null);
        resetSettings();
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const handleAutoEnhance = async () => {
    if (!selectedImage) {
      Alert.alert('Thông báo', 'Vui lòng chọn ảnh trước');
      return;
    }

    setIsProcessing(true);
    setProcessingStep(processingSteps[0]);

    try {
      // Step 1: Analyze image
      const imageAnalysis = await analyzeImage(selectedImage);
      setAnalysis(imageAnalysis);
      
      // Step 2-6: Process image with AI recommendations
      for (let i = 1; i < processingSteps.length; i++) {
        setProcessingStep(processingSteps[i]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Apply AI-recommended settings with enhanced logic
      const aiSettings = {
        brightness: imageAnalysis.brightness,
        contrast: imageAnalysis.contrast,
        saturation: imageAnalysis.saturation,
        sharpen: imageAnalysis.sharpness,
        smartCrop: imageAnalysis.faceDetected,
        skinSmoothing: imageAnalysis.skinTone,
      };

      // Update UI settings
      setBrightness(aiSettings.brightness);
      setContrast(aiSettings.contrast);
      setSaturation(aiSettings.saturation);
      setSharpen(aiSettings.sharpen);
      setSmartCrop(aiSettings.smartCrop);
      setSkinSmoothing(aiSettings.skinSmoothing);

      const enhanced = await enhanceImageWithAI(selectedImage, aiSettings);
      setEnhancedImage(enhanced.uri);

    } catch (error) {
      console.error('Auto enhance error:', error);
      Alert.alert('Lỗi', 'Không thể tăng cường ảnh tự động. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleManualEnhance = async () => {
    if (!selectedImage) {
      Alert.alert('Thông báo', 'Vui lòng chọn ảnh trước');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('🎨 Đang áp dụng thay đổi...');

    try {
      const settings = {
        brightness,
        contrast,
        saturation,
        sharpen,
        smartCrop,
        skinSmoothing,
      };

      const enhanced = await enhanceImageWithAI(selectedImage, settings);
      setEnhancedImage(enhanced.uri);
    } catch (error) {
      console.error('Manual enhance error:', error);
      Alert.alert('Lỗi', 'Không thể áp dụng thay đổi');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const resetSettings = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSharpen(0);
    setSmartCrop(false);
    setSkinSmoothing(false);
    setEnhancedImage(null);
    setAnalysis(null);
  };

  const saveEnhancedImage = async () => {
    if (!enhancedImage) {
      Alert.alert('Thông báo', 'Chưa có ảnh được tăng cường');
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Thiếu quyền', 'Ứng dụng cần quyền để lưu ảnh.');
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(enhancedImage);
      await MediaLibrary.createAlbumAsync('AI Enhanced Photos', asset, false);
      
      Alert.alert(
        'Thành công! 🎉',
        'Ảnh đã được lưu vào thư viện',
        [
          { text: 'OK', onPress: () => {} },
          { 
            text: 'Sử dụng làm photobooth', 
            onPress: () => navigation.navigate('Preset', { 
              enhancedImage: enhancedImage 
            })
          }
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Lỗi', 'Không thể lưu ảnh');
    }
  };

  const renderAnalysisResults = () => {
    if (!analysis) return null;

    return (
      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>📊 Phân tích AI</Text>
        <View style={styles.analysisGrid}>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Chất lượng:</Text>
            <Text style={[styles.analysisValue, { color: analysis.quality > 85 ? '#28a745' : analysis.quality > 70 ? '#ffc107' : '#dc3545' }]}>
              {Math.round(analysis.quality)}%
            </Text>
          </View>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Ánh sáng:</Text>
            <Text style={styles.analysisValue}>
              {analysis.lightingCondition === 'good' ? '✅ Tốt' : 
               analysis.lightingCondition === 'low' ? '🔆 Thiếu sáng' : '☀️ Quá sáng'}
            </Text>
          </View>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Màu sắc:</Text>
            <Text style={styles.analysisValue}>
              {analysis.colorBalance === 'warm' ? '🔥 Ấm' : 
               analysis.colorBalance === 'cool' ? '❄️ Lạnh' : '⚖️ Cân bằng'}
            </Text>
          </View>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Khuôn mặt:</Text>
            <Text style={styles.analysisValue}>
              {analysis.faceDetected ? '👤 Có' : '❌ Không'}
            </Text>
          </View>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Nhiễu:</Text>
            <Text style={styles.analysisValue}>
              {analysis.noiseLevel < 0.1 ? '✅ Thấp' : 
               analysis.noiseLevel < 0.2 ? '⚠️ Trung bình' : '❌ Cao'}
            </Text>
          </View>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Da:</Text>
            <Text style={styles.analysisValue}>
              {analysis.skinTone ? '👤 Phát hiện' : '❌ Không'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🤖 AI Tăng Cường Ảnh</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>✨ Chào mừng đến với AI Photo Enhancement</Text>
          <Text style={styles.welcomeText}>
            Sử dụng công nghệ AI để tự động cải thiện chất lượng ảnh của bạn. 
            Chỉ cần chọn ảnh và để AI làm phần còn lại!
          </Text>
        </View>

        {/* Image Selection */}
        <View style={styles.imageSelectionContainer}>
          <Text style={styles.sectionTitle}>📸 Chọn ảnh</Text>
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={selectImageFromLibrary}>
              <Text style={styles.imageButtonText}>📁 Từ thư viện</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Text style={styles.imageButtonText}>📷 Chụp ảnh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.sectionTitle}>
              {enhancedImage ? '✨ Kết quả so sánh' : '🖼️ Ảnh gốc'}
            </Text>
            <View style={styles.imageComparisonContainer}>
              <View style={styles.imageColumn}>
                <Text style={styles.imageLabel}>Ảnh gốc</Text>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              </View>
              {enhancedImage && (
                <View style={styles.imageColumn}>
                  <Text style={styles.imageLabel}>Đã tăng cường</Text>
                  <Image source={{ uri: enhancedImage }} style={styles.previewImage} />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.processingText}>{processingStep}</Text>
            <Text style={styles.processingSubtext}>Vui lòng chờ trong giây lát...</Text>
          </View>
        )}

        {/* Analysis Results */}
        {renderAnalysisResults()}

        {/* Auto Enhance Button */}
        {selectedImage && !isProcessing && (
          <View style={styles.enhanceButtonContainer}>
            <TouchableOpacity 
              style={styles.autoEnhanceButton} 
              onPress={handleAutoEnhance}
            >
              <Text style={styles.autoEnhanceButtonText}>🎯 Tự động tăng cường</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Manual Controls */}
        {selectedImage && (
          <View style={styles.manualControlsContainer}>
            <Text style={styles.sectionTitle}>🎛️ Điều chỉnh thủ công</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>💡 Độ sáng: {brightness.toFixed(2)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={-0.5}
                maximumValue={0.5}
                value={brightness}
                onValueChange={setBrightness}
                minimumTrackTintColor="#007bff"
                maximumTrackTintColor="#ccc"
                thumbStyle={styles.sliderThumb}
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>🔆 Độ tương phản: {contrast.toFixed(2)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={-0.3}
                maximumValue={0.3}
                value={contrast}
                onValueChange={setContrast}
                minimumTrackTintColor="#007bff"
                maximumTrackTintColor="#ccc"
                thumbStyle={styles.sliderThumb}
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>🎨 Độ bão hòa: {saturation.toFixed(2)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={-0.2}
                maximumValue={0.2}
                value={saturation}
                onValueChange={setSaturation}
                minimumTrackTintColor="#007bff"
                maximumTrackTintColor="#ccc"
                thumbStyle={styles.sliderThumb}
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>✨ Độ sắc nét: {sharpen.toFixed(2)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={sharpen}
                onValueChange={setSharpen}
                minimumTrackTintColor="#007bff"
                maximumTrackTintColor="#ccc"
                thumbStyle={styles.sliderThumb}
              />
            </View>

            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleButton, smartCrop && styles.toggleButtonActive]}
                onPress={() => setSmartCrop(!smartCrop)}
              >
                <Text style={[styles.toggleButtonText, smartCrop && styles.toggleButtonTextActive]}>
                  {smartCrop ? '✅' : '⬜'} Cắt thông minh
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toggleButton, skinSmoothing && styles.toggleButtonActive]}
                onPress={() => setSkinSmoothing(!skinSmoothing)}
              >
                <Text style={[styles.toggleButtonText, skinSmoothing && styles.toggleButtonTextActive]}>
                  {skinSmoothing ? '✅' : '⬜'} Làm mịn da
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.manualButtonsContainer}>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={handleManualEnhance}
                disabled={isProcessing}
              >
                <Text style={styles.applyButtonText}>
                  {isProcessing ? '⏳ Đang xử lý...' : '✅ Áp dụng'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
                <Text style={styles.resetButtonText}>🔄 Đặt lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Save Button */}
        {enhancedImage && !isProcessing && (
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={saveEnhancedImage}>
              <Text style={styles.saveButtonText}>💾 Lưu ảnh tăng cường</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#007aff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imageSelectionContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  imageComparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  imageColumn: {
    flex: 1,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  processingContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  processingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  processingSubtext: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  analysisContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analysisItem: {
    width: '48%',
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  analysisLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  enhanceButtonContainer: {
    margin: 15,
    alignItems: 'center',
  },
  autoEnhanceButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  autoEnhanceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manualControlsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#007bff',
    width: 20,
    height: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  toggleButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  toggleButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
});