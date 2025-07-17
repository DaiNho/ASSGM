import React from "react";
import {
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import { presets } from "./presets/presets"; // Import presets để có thể random

export default function HomeScreen({ navigation }) {
  const handleRandomMode = () => {
    // Chọn ngẫu nhiên một preset từ danh sách
    const randomIndex = Math.floor(Math.random() * presets.length);
    const randomPreset = presets[randomIndex];

    // Chuyển sang PresetScreen với preset đã được chọn random
    navigation.navigate("Preset", {
      randomMode: true,
      selectedPreset: randomPreset,
    });
  };

  return (
    <ImageBackground
      source={require("./assets/8.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.darkOverlay} />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>📸 Photobooth Studio</Text>
          <Text style={styles.subtitle}>Hãy chọn chế độ chụp hình của bạn</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.presetButton]}
            onPress={() => navigation.navigate("Preset")}
          >
            <Text style={styles.buttonText}>📷 Chế độ có sẵn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.aiButton]}
            onPress={() => {
              navigation.navigate("AIScreen");
            }}
          >
            <Text style={styles.buttonText}>🤖 Chế độ AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.randomButton]}
            onPress={handleRandomMode}
          >
            <Text style={styles.buttonText}>🎲 Chế độ Random</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 0,
  },
  overlay: {
    flex: 1,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
  },
  buttonContainer: {
    alignItems: "center",
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginVertical: 6,
    minWidth: 180,
    alignItems: "center",
    elevation: 3,
  },
  presetButton: {
    backgroundColor: "#ff6f91",
  },
  aiButton: {
    backgroundColor: "#845ec2",
  },
  randomButton: {
    backgroundColor: "#ffc75f",
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
