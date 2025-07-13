import React, { useState, useEffect, useRef } from "react";
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
  TextInput,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";
import { presets } from "./presets";
import FramePreview from "./FramePreview";

const screenWidth = Dimensions.get("window").width;
const itemWidth = (screenWidth - 48) / 2;

const getPresetHeight = (preset) => {
  const baseHeight = 180;
  const slotCount = preset.slots.length;
  if (slotCount <= 2) return baseHeight;
  if (slotCount <= 4) return baseHeight + 40;
  if (slotCount <= 6) return baseHeight + 80;
  return baseHeight + 120;
};

const getUniqueLabels = () => {
  const labels = presets.map((preset) => preset.label);
  return [...new Set(labels)];
};

export default function PresetsScreen({
  navigation,
  route,
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
  const framePreviewRef = useRef();

  // States cho tìm kiếm và filter
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filteredPresets, setFilteredPresets] = useState(presets);
  const [showFilters, setShowFilters] = useState(false);

  // Lấy danh sách unique labels
  const uniqueLabels = getUniqueLabels();

  // Effect để filter presets
  useEffect(() => {
    let filtered = presets;

    // Filter theo label được chọn
    if (selectedFilter !== "all") {
      filtered = filtered.filter((preset) => preset.label === selectedFilter);
    }

    // Filter theo search text
    if (searchText.trim()) {
      filtered = filtered.filter((preset) =>
        preset.label.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredPresets(filtered);
  }, [searchText, selectedFilter]);

  useEffect(() => {
    if (route.params?.aiGeneratedPreset) {
      const presetFromAI = route.params.aiGeneratedPreset;
      setSelectedPreset(presetFromAI);
      setUserImages(Array(presetFromAI.slots.length).fill(null));
      setEditedResult(null);

      navigation.setParams({ aiGeneratedPreset: undefined });
    }
  }, [
    route.params?.aiGeneratedPreset,
    navigation,
    setSelectedPreset,
    setUserImages,
  ]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      const currentRoute = navigation
        .getState()
        ?.routes.find((r) => r.name === "Preset");
      if (currentRoute?.params?.editedImages) {
        setEditedResult(currentRoute.params.editedImages);
      }
    });
    return unsubscribe;
  }, [navigation]);

  const handleBackToPresets = () => {
    Alert.alert(
      "Quay lại chọn khung?",
      "Bạn sẽ mất tất cả ảnh đã chọn. Bạn có chắc chắn?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          style: "destructive",
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
    Alert.alert("Xóa ảnh", "Bạn có chắc chắn muốn xóa ảnh này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          const updated = [...userImages];
          updated[index] = null;
          setUserImages(updated);
          setEditedResult(null);
        },
      },
    ]);
  };

  const handleQuickFill = () => {
    Alert.alert(
      "Chọn cách thêm ảnh",
      `Bạn cần thêm ${totalSlots - filledCount} ảnh nữa`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "📷 Chụp tất cả", onPress: () => autoCaptureForSlots(0) },
        { text: "📁 Chọn từ thư viện", onPress: pickMultipleImages },
      ]
    );
  };

  const requestWriteExternalStoragePermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleSaveImage = async () => {
    const hasPermission = await requestWriteExternalStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        "Không có quyền",
        "Không thể lưu ảnh do thiếu quyền truy cập bộ nhớ."
      );
      return;
    }

    if (framePreviewRef.current) {
      try {
        const uri = await framePreviewRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("Thành công", "Ảnh đã được lưu vào thư viện!");
      } catch (error) {
        console.error("Lỗi lưu ảnh:", error);
        Alert.alert("Lỗi", "Không thể lưu ảnh. Vui lòng thử lại.");
      }
    }
  };

  // Xử lý filter button
  const handleFilterPress = (label) => {
    setSelectedFilter(label);
    setShowFilters(false);
  };

  const getSelectedFilterName = () => {
    if (selectedFilter === "all") return "Tất cả";
    return selectedFilter;
  };

  if (!selectedPreset) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chọn khung ảnh</Text>
          <Text style={styles.headerSubtitle}>
            Hãy chọn một khung ảnh mà bạn yêu thích
          </Text>

          {/* Thanh tìm kiếm và filter compact */}
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#999"
              />
              <Text style={styles.searchIcon}>🔍</Text>
            </View>

            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={styles.filterToggleText}>
                {getSelectedFilterName()}
              </Text>
              <Text style={styles.filterToggleIcon}>
                {showFilters ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dropdown filter */}
          {showFilters && (
            <View style={styles.filterDropdown}>
              <TouchableOpacity
                style={[
                  styles.filterItem,
                  selectedFilter === "all" && styles.filterItemActive,
                ]}
                onPress={() => handleFilterPress("all")}
              >
                <Text
                  style={[
                    styles.filterItemText,
                    selectedFilter === "all" && styles.filterItemTextActive,
                  ]}
                >
                  Tất cả ({presets.length})
                </Text>
              </TouchableOpacity>
              {uniqueLabels.map((label, index) => {
                const count = presets.filter((p) => p.label === label).length;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterItem,
                      selectedFilter === label && styles.filterItemActive,
                    ]}
                    onPress={() => handleFilterPress(label)}
                  >
                    <Text
                      style={[
                        styles.filterItemText,
                        selectedFilter === label && styles.filterItemTextActive,
                      ]}
                    >
                      {label} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <FlatList
          data={filteredPresets}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const presetHeight = getPresetHeight(item);
            return (
              <TouchableOpacity
                style={[styles.presetCard, { height: presetHeight + 60 }]}
                onPress={() => {
                  setSelectedPreset(item);
                  setUserImages(Array(item.slots.length).fill(null));
                  setEditedResult(null);
                  setShowFilters(false);
                }}
              >
                <View style={[styles.imageContainer, { height: presetHeight }]}>
                  <Image
                    source={item.image}
                    style={[styles.presetImage, { height: presetHeight - 24 }]}
                    resizeMode="contain"
                  />
                  <View style={styles.overlay}>
                    <Text style={styles.slotCount}>
                      {item.slots.length} ảnh
                    </Text>
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.presetLabel}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.presetsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Không tìm thấy khung ảnh phù hợp
              </Text>
              <Text style={styles.emptySubtext}>
                Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.selectedHeader}>
        <TouchableOpacity
          onPress={handleBackToPresets}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Chọn khung khác</Text>
        </TouchableOpacity>
        <Text style={styles.selectedTitle}>{selectedPreset.label}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.previewContainer}>
          <Text style={styles.previewInfoText}>
            {editedResult
              ? "📸 Ảnh sau khi chỉnh sửa:"
              : "🎨 Khung ảnh xem trước"}
          </Text>
          <ViewShot
            ref={framePreviewRef}
            options={{ format: "png", quality: 1 }}
          >
            <FramePreview
              preset={selectedPreset}
              userImages={editedResult || userImages}
              containerWidth={screenWidth * 0.85}
            />
          </ViewShot>
        </View>

        {editedResult && (
          <View style={styles.finalActionContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSaveImage}
            >
              <Text style={styles.primaryButtonText}>
                ⬇️ Lưu ảnh vào thư viện
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {filledCount < totalSlots && (
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>
              Cần thêm {totalSlots - filledCount} ảnh
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleQuickFill}
            >
              <Text style={styles.primaryButtonText}>⚡ Thêm nhanh</Text>
            </TouchableOpacity>
          </View>
        )}

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
                    {uri ? "✓ Đã có" : "○ Trống"}
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

        {filledCount === totalSlots && !editedResult && (
          <View style={styles.completionContainer}>
            <Text style={styles.completionText}>
              🎉 Hoàn thành! Tất cả ảnh đã được chọn
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                navigation.navigate("EditScreen", {
                  selectedPreset,
                  userImages: userImages.map((uri) => ({ uri })),
                })
              }
            >
              <Text style={styles.editButtonText}>✏️ Chỉnh sửa & Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 16, color: "#6c757d", marginBottom: 16 },

  // Styles mới cho search và filter compact
  searchFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#212529",
  },
  searchIcon: {
    fontSize: 16,
    color: "#6c757d",
  },

  // Filter toggle button
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
    height: 40,
    minWidth: 80,
  },
  filterToggleText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
    marginRight: 6,
  },
  filterToggleIcon: {
    fontSize: 12,
    color: "#6c757d",
  },

  // Dropdown filter
  filterDropdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
  },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  filterItemActive: {
    backgroundColor: "#e3f2fd",
  },
  filterItemText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },
  filterItemTextActive: {
    color: "#1976d2",
    fontWeight: "600",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#adb5bd",
    textAlign: "center",
  },

  presetsList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  presetCard: {
    width: itemWidth,
    margin: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  imageContainer: {
    position: "relative",
    backgroundColor: "#fafbfc",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  presetImage: { width: itemWidth - 40, borderRadius: 12 },
  overlay: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  slotCount: { color: "#fff", fontSize: 11, fontWeight: "600" },
  cardContent: { padding: 12, backgroundColor: "rgba(255, 255, 255, 0.98)" },
  presetLabel: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 18,
  },
  selectedHeader: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: { marginBottom: 8 },
  backButtonText: { color: "#007bff", fontSize: 16, fontWeight: "500" },
  selectedTitle: { fontSize: 20, fontWeight: "bold", color: "#212529" },
  scrollContent: { paddingBottom: 32 },
  progressContainer: { margin: 20, marginBottom: 16 },
  progressBar: {
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#28a745", borderRadius: 4 },
  progressText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  previewInfoText: {
    fontSize: 16,
    color: "#495057",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  finalActionContainer: {
    alignItems: "center",
    marginTop: -10,
    marginBottom: 20,
  },
  quickActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  slotsContainer: { paddingHorizontal: 20 },
  slotsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 16,
  },
  imageSlot: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  slotNumber: { fontSize: 16, fontWeight: "600", color: "#495057" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusFilled: { backgroundColor: "#d4edda" },
  statusEmpty: { backgroundColor: "#f8d7da" },
  statusText: { fontSize: 12, fontWeight: "500", color: "#495057" },
  filledSlot: { alignItems: "center" },
  slotImage: { width: 120, height: 160, borderRadius: 12, marginBottom: 12 },
  slotActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  emptySlot: { alignItems: "center", paddingVertical: 20 },
  emptySlotText: { fontSize: 14, color: "#6c757d", marginBottom: 16 },
  emptySlotActions: { flexDirection: "row", gap: 12 },
  actionButton: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  actionButtonText: { fontSize: 14, color: "#495057", fontWeight: "500" },
  primaryAction: { backgroundColor: "#007bff", borderColor: "#007bff" },
  primaryActionText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  deleteButton: { backgroundColor: "#f8d7da", borderColor: "#f5c6cb" },
  deleteButtonText: { color: "#721c24", fontSize: 14, fontWeight: "500" },
  completionContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: "#d4edda",
    borderRadius: 16,
    alignItems: "center",
  },
  completionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#155724",
    marginBottom: 12,
    textAlign: "center",
  },
  editButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  editButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
