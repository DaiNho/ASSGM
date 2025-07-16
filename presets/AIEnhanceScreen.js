import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Share,
  ImageBackground,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from "react-native";
import * as Clipboard from "expo-clipboard";

const { width, height } = Dimensions.get("window");
const GEMINI_API_KEY = "AIzaSyC5AQUdhW07udAneOUrcJlW8tq6a3cfBPE";

// Utility functions
const checkNetworkConnection = async () => {
  try {
    const response = await fetch("https://www.google.com", {
      method: "HEAD",
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delayTime = Math.pow(2, i) * 1000;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delayTime}ms`);
      await delay(delayTime);
    }
  }
};

// API function
const generateCaptionWithPrompt = async (userPrompt) => {
  const hasConnection = await checkNetworkConnection();
  if (!hasConnection) {
    throw new Error(
      "Không có kết nối mạng. Vui lòng kiểm tra kết nối internet."
    );
  }

  const prompt = `Dựa trên yêu cầu: "${userPrompt}"

Tạo caption:
- Đáp ứng chính xác yêu cầu
- Tự nhiên và hấp dẫn
- Có emoji phù hợp
- Độ dài phù hợp

Chỉ trả về caption, không format khác.`;

  const geminiGenerate = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 1,
              topP: 1,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMessages = {
          401: "API key không hợp lệ",
          403: "Không có quyền truy cập API",
          404: "API endpoint không tồn tại",
          429: "Đã vượt quá giới hạn API",
          400: "Yêu cầu không hợp lệ",
        };

        throw new Error(
          errorMessages[response.status] || `Lỗi API: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Phản hồi API không hợp lệ hoặc bị chặn");
      }

      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  return await retryWithBackoff(geminiGenerate, 3);
};

export default function AIEnhanceScreen({ navigation }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [generatedCaption, setGeneratedCaption] = useState("");

  // Example prompts
  const examplePrompts = useMemo(
    () => [
      {
        icon: "😂",
        label: "Hài hước",
        prompt: "Tạo caption vui vẻ và hài hước về cuộc sống",
      },
      {
        icon: "💼",
        label: "Chuyên nghiệp",
        prompt: "Viết caption chuyên nghiệp về thành công trong công việc",
      },
      {
        icon: "💕",
        label: "Lãng mạn",
        prompt: "Tạo caption lãng mạn về tình yêu với emoji trái tim",
      },
      {
        icon: "✨",
        label: "Truyền cảm hứng",
        prompt: "Viết caption truyền cảm hứng và tích cực về cuộc sống",
      },
      {
        icon: "🌍",
        label: "Du lịch",
        prompt: "Tạo caption về du lịch và khám phá thế giới",
      },
      {
        icon: "🍲",
        label: "Ẩm thực",
        prompt: "Viết caption về ẩm thực và món ăn ngon",
      },
    ],
    []
  );

  const handleGenerateCaption = useCallback(async () => {
    if (!userPrompt.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập yêu cầu cho caption");
      return;
    }

    setIsGenerating(true);
    try {
      const caption = await generateCaptionWithPrompt(userPrompt.trim());
      setGeneratedCaption(caption);
    } catch (error) {
      console.error("Caption generation error:", error);

      let errorMessage = "Không thể tạo caption. ";

      if (error.name === "AbortError") {
        errorMessage += "Yêu cầu bị timeout. Vui lòng thử lại.";
      } else if (error.message.includes("Network request failed")) {
        errorMessage += "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
      } else {
        errorMessage += error.message || "Vui lòng thử lại sau.";
      }

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [userPrompt]);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Thành công", "Đã copy caption!");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể copy caption.");
    }
  }, []);

  const shareCaption = useCallback(async () => {
    if (!generatedCaption) return;

    try {
      await Share.share({
        message: generatedCaption,
        title: "Caption được tạo bởi AI",
      });
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chia sẻ caption.");
    }
  }, [generatedCaption]);

  const selectExamplePrompt = useCallback((prompt) => {
    setUserPrompt(prompt);
  }, []);

  const clearAll = useCallback(() => {
    setUserPrompt("");
    setGeneratedCaption("");
  }, []);

  return (
    <ImageBackground
      source={require("../assets/8.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
      <View style={styles.darkOverlay} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>← Quay lại</Text>
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>🤖 AI Caption Generator</Text>
              <Text style={styles.headerSubtitle}>
                Tạo caption theo yêu cầu với Gemini AI
              </Text>
            </View>

            {(userPrompt || generatedCaption) && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAll}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Xóa</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Main Input Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💬 Nhập yêu cầu của bạn</Text>
              <TextInput
                style={styles.promptInput}
                placeholder="Ví dụ: Tạo caption lãng mạn về tình yêu, thêm emoji trái tim..."
                value={userPrompt}
                onChangeText={setUserPrompt}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#999"
                maxLength={500}
              />

              <View style={styles.inputFooter}>
                <Text style={styles.characterCount}>
                  {userPrompt.length}/500
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.generateButton,
                  (!userPrompt.trim() || isGenerating) &&
                    styles.generateButtonDisabled,
                ]}
                onPress={handleGenerateCaption}
                disabled={!userPrompt.trim() || isGenerating}
                activeOpacity={0.8}
              >
                {isGenerating ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.loadingText}>Đang tạo caption...</Text>
                  </View>
                ) : (
                  <Text style={styles.generateButtonText}>
                    ✨ Tạo Caption với AI
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Generated Caption */}
            {generatedCaption && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Caption được tạo</Text>
                <View style={styles.captionContainer}>
                  <ScrollView
                    style={styles.captionScrollView}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={styles.captionText}>{generatedCaption}</Text>
                  </ScrollView>

                  <View style={styles.captionActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => copyToClipboard(generatedCaption)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionButtonText}>📋 Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={shareCaption}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionButtonText}>📤 Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Quick Examples */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Ví dụ yêu cầu</Text>
              <View style={styles.exampleContainer}>
                {examplePrompts.map((example, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.exampleButton}
                    onPress={() => selectExamplePrompt(example.prompt)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.exampleIcon}>{example.icon}</Text>
                    <Text style={styles.exampleText}>{example.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    minHeight: 80,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: "#007bff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#dc3545",
    borderRadius: 6,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 16,
  },
  promptInput: {
    borderWidth: 2,
    borderColor: "#dee2e6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    minHeight: 120,
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  characterCount: {
    fontSize: 12,
    color: "#6c757d",
  },
  generateButton: {
    backgroundColor: "#28a745",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  generateButtonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.7,
    elevation: 1,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  captionContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
    overflow: "hidden",
  },
  captionScrollView: {
    maxHeight: 200,
    padding: 16,
  },
  captionText: {
    fontSize: 16,
    color: "#212529",
    lineHeight: 24,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  captionActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#007bff",
    paddingVertical: 12,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#0056b3",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  exampleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  exampleButton: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exampleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  exampleText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "600",
  },
});
