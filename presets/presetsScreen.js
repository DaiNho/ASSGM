import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
  CameraRoll, // For saving image to gallery
} from 'react-native';
import ViewShot from 'react-native-view-shot'; // Import ViewShot
import { presets } from './presets';
import FramePreview from './FramePreview';

const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - 48) / 2;

export default function PresetsScreen({
  navigation,
  selectedPreset,
  setSelectedPreset,
  userImages,
  setUserImages,
  pickMultipleImages,
  autoCaptureForSlots,
  takePhoto,
  handleSelectImage,
}) {
  const filledCount = userImages.filter(Boolean).length;
  const totalSlots = selectedPreset?.slots.length || 0;
  const [editedResult, setEditedResult] = useState(null);

  const framePreviewRef = useRef(); // Ref for ViewShot

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const routeParams = navigation.getState()?.routes.find(
        (r) => r.name === 'PresetsScreen'
      )?.params;

      if (routeParams?.editedImages) {
        setEditedResult(routeParams.editedImages);
        // Ensure that selectedPreset and userImages are also updated if coming from EditScreen
        if (routeParams.selectedPreset) {
          setSelectedPreset(routeParams.selectedPreset);
        }
        if (routeParams.userImages) {
          setUserImages(routeParams.userImages);
        }
        // Xoá editedImages khỏi params để không bị trigger lại
        navigation.setParams({ editedImages: undefined, selectedPreset: undefined, userImages: undefined });
      }
    });

    return unsubscribe;
  }, [navigation]);

  const handleBackToPresets = () => {
    Alert.alert(
      'Quay lại chọn khung?',
      'Bạn sẽ mất tất cả ảnh đã chọn. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: 'destructive',
          onPress: () => {
            setSelectedPreset(null);
            setUserImages([]);
            setEditedResult(null);
          },
        },
      ]
    );
  };

  const handleRemoveImage = (index) => {
    Alert.alert('Xóa ảnh', 'Bạn có chắc chắn muốn xóa ảnh này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          const updated = [...userImages];
          updated[index] = null;
          setUserImages(updated);
          setEditedResult(null); // Reset edited
        },
      },
    ]);
  };

  const handleQuickFill = () => {
    Alert.alert(
      'Chọn cách thêm ảnh',
      `Bạn cần thêm ${totalSlots - filledCount} ảnh nữa`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: '📷 Chụp tất cả',
          onPress: () => autoCaptureForSlots(0),
        },
        {
          text: '📁 Chọn từ thư viện',
          onPress: pickMultipleImages,
        },
      ]
    );
  };

  const requestWriteExternalStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Quyền truy cập bộ nhớ',
            message: 'Ứng dụng cần quyền truy cập bộ nhớ để lưu ảnh.',
            buttonNeutral: 'Hỏi lại sau',
            buttonNegative: 'Hủy',
            buttonPositive: 'Đồng ý',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS doesn't need explicit permission for CameraRoll for saving images
  };

  const handleSaveEditedImage = async () => {
    const hasPermission = await requestWriteExternalStoragePermission();
    if (!hasPermission) {
      Alert.alert('Không có quyền', 'Không thể lưu ảnh do thiếu quyền truy cập bộ nhớ.');
      return;
    }

    if (framePreviewRef.current) {
      try {
        const uri = await framePreviewRef.current.capture();
        CameraRoll.save(uri, { type: 'photo' })
          .then(() => Alert.alert('Thành công', 'Ảnh đã được lưu vào thư viện!'))
          .catch((error) => {
            console.error('Failed to save image:', error);
            Alert.alert('Lỗi', 'Không thể lưu ảnh. Vui lòng thử lại.');
          });
      } catch (error) {
        console.error('Oops, snapshot failed', error);
        Alert.alert('Lỗi', 'Không thể tạo ảnh. Vui lòng thử lại.');
      }
    }
  };

  if (!selectedPreset) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chọn khung ảnh</Text>
          <Text style={styles.headerSubtitle}>
            Hãy chọn một khung ảnh mà bạn yêu thích
          </Text>
        </View>

        <FlatList
          data={presets}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.presetCard}
              onPress={() => {
                setSelectedPreset(item);
                setUserImages(Array(item.slots.length).fill(null));
                setEditedResult(null); // Clear any previous edited result
              }}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={item.image}
                  style={styles.presetImage}
                  resizeMode="cover"
                />
                <View style={styles.overlay}>
                  <Text style={styles.slotCount}>{item.slots.length} ảnh</Text>
                </View>
              </View>
              <Text style={styles.presetLabel}>{item.label}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.presetsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.selectedHeader}>
        <TouchableOpacity onPress={handleBackToPresets} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Chọn khung khác</Text>
        </TouchableOpacity>
        <Text style={styles.selectedTitle}>{selectedPreset.label}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(filledCount / totalSlots) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {filledCount}/{totalSlots} ảnh đã chọn
          </Text>
        </View>

        {/* Display FramePreview based on editedResult or userImages */}
        <View style={styles.previewContainer}>
          {editedResult ? (
            <>
              <Text style={styles.previewInfoText}>📸 Ảnh sau khi chỉnh sửa:</Text>
              <ViewShot ref={framePreviewRef} options={{ format: 'png', quality: 1 }}>
                <FramePreview
                  preset={selectedPreset}
                 userImages={editedResult}
                  containerWidth={screenWidth * 0.85}
                />
              </ViewShot>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 20 }]}
                onPress={handleSaveEditedImage}
              >
                <Text style={styles.primaryButtonText}>⬇️ Lưu ảnh đã sửa</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {filledCount < totalSlots && (
                <Text style={styles.previewInfoText}>🖼️ Xem trước khung của bạn:</Text>
              )}
              <FramePreview
                preset={selectedPreset}
                userImages={userImages}
                containerWidth={screenWidth * 0.85}
              />
            </>
          )}
        </View>

        {/* Nút Thêm nhanh ảnh khi chưa đủ */}
        {filledCount < totalSlots && (
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>
              Cần thêm {totalSlots - filledCount} ảnh
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleQuickFill}
            >
              <Text style={styles.primaryButtonText}>
                ⚡ Thêm nhanh {totalSlots - filledCount} ảnh
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Danh sách ảnh từng slot */}
        <View style={styles.slotsContainer}>
          <Text style={styles.slotsTitle}>Quản lý từng ảnh</Text>
          {userImages.map((uri, index) => (
            <View key={index} style={styles.imageSlot}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotNumber}>Ảnh {index + 1}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    uri ? styles.statusFilled : styles.statusEmpty,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {uri ? '✓ Đã có' : '○ Trống'}
                  </Text>
                </View>
              </View>

              {uri ? (
                <View style={styles.filledSlot}>
                  <Image source={{ uri }} style={styles.slotImage} />
                  <View style={styles.slotActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => takePhoto(index)}
                    >
                      <Text style={styles.actionButtonText}>📷 Chụp lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSelectImage(index)}
                    >
                      <Text style={styles.actionButtonText}>📁 Chọn lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.emptySlot}>
                  <Text style={styles.emptySlotText}>Chưa có ảnh</Text>
                  <View style={styles.emptySlotActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryAction]}
                      onPress={() => takePhoto(index)}
                    >
                      <Text style={styles.primaryActionText}>📷 Chụp ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSelectImage(index)}
                    >
                      <Text style={styles.actionButtonText}>📁 Chọn ảnh</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Nếu đã đủ ảnh, hiện nút chuyển sang EditScreen */}
        {filledCount === totalSlots && !editedResult && ( // Only show if not already edited and displayed
          <View style={styles.completionContainer}>
            <Text style={styles.completionText}>
              🎉 Hoàn thành! Tất cả ảnh đã được chọn
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                navigation.navigate('EditScreen', {
                  selectedPreset,
                 userImages: editedResult || userImages.map(uri => ({ uri })), // Pass original URIs with object structure
                })
              }
            >
              <Text style={styles.editButtonText}>✏️ Chỉnh sửa thiết kế</Text>
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
  
  // Header styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },

  // Presets list styles
  presetsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  presetCard: {
    width: itemWidth,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  presetImage: {
    width: '100%',
    height: 180,
  },
  overlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  slotCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  presetLabel: {
    padding: 12,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    color: '#495057',
  },

  // Selected preset styles
  selectedHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },

  scrollContent: {
    paddingBottom: 32,
  },

  // Progress styles
  progressContainer: {
    margin: 20,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },

  // Preview styles
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  previewInfoContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e7f3ff',
    borderRadius: 20,
  },
  previewInfoText: {
    fontSize: 13,
    color: '#0066cc',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Quick actions styles
  quickActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Slots styles
  slotsContainer: {
    paddingHorizontal: 20,
  },
  slotsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  imageSlot: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusFilled: {
    backgroundColor: '#d4edda',
  },
  statusEmpty: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },

  // Filled slot styles
  filledSlot: {
    alignItems: 'center',
  },
  slotImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  slotActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },

  // Empty slot styles
  emptySlot: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptySlotText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  emptySlotActions: {
    flexDirection: 'row',
    gap: 12,
  },

  // Action buttons styles
  actionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  primaryAction: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  deleteButtonText: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: '500',
  },

  // Completion styles
  completionContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#d4edda',
    borderRadius: 16,
    alignItems: 'center',
  },
  completionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 12,
  },
  editButton: { // Renamed from exportButton for clarity
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});