// File: screens/AIScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import { presets } from '../presets/presets';
import { Ionicons } from '@expo/vector-icons';

const AIScreen = ({ navigation }) => {
  const [input, setInput] = useState('');
  const [suggestedPresets, setSuggestedPresets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const analyzeMood = async (message) => {
    const apiKey = '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'; // Thay bằng OpenAI API key thật
    const url = 'https://api.openai.com/v1/chat/completions';

    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Bạn là một AI giúp phân tích cảm xúc từ câu văn. Chỉ trả về danh sách các từ cảm xúc như: vui, buồn, yêu, ngạc nhiên, tức giận,... Không trả lời gì thêm. Không cần dấu chấm câu.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.5
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      console.log('📥 GPT raw output:', rawText);

      if (!rawText) throw new Error('GPT không trả về kết quả.');

      const keywords = rawText
        .toLowerCase()
        .match(/vui|buồn|yêu|ngạc nhiên|tức giận/g);

      console.log('🎯 Từ khóa GPT:', keywords);

      return keywords || [];
    } catch (err) {
      console.error('❌ GPT error:', err);
      throw new Error('Không thể kết nối đến GPT');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { from: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const keywords = await analyzeMood(userMessage);

      const matched = presets.filter(preset =>
        keywords.includes(preset.mood.toLowerCase())
      );

      setSuggestedPresets(matched);

      const botReply = matched.length
        ? `Tôi đã tìm thấy ${matched.length} khung phù hợp với tâm trạng của bạn.`
        : `Tôi không tìm thấy khung nào phù hợp. Hãy thử mô tả rõ hơn nhé!`;

      setMessages(prev => [...prev, { from: 'bot', text: botReply }]);
    } catch (error) {
      console.error('❌ Lỗi GPT:', error.message);
      setMessages(prev => [...prev, { from: 'bot', text: 'Đã xảy ra lỗi khi phân tích tâm trạng: ' + error.message }]);
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={[styles.message, item.from === 'user' ? styles.user : styles.bot]}>
            {item.from === 'user' ? '👤' : '🤖'} {item.text}
          </Text>
        )}
        contentContainerStyle={{ padding: 16 }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Nhập cảm xúc hoặc yêu cầu..."
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ marginVertical: 10 }} size="large" />}

      <FlatList
        data={suggestedPresets}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.frameContainer}
            onPress={() => navigation.navigate('CameraScreen', { preset: item })}
          >
            <Image source={item.image} style={styles.frameImage} />
            <Text style={styles.frameLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  message: { marginVertical: 4, fontSize: 16 },
  user: { textAlign: 'right', color: '#333' },
  bot: { textAlign: 'left', color: '#007AFF' },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 8
  },
  frameContainer: {
    marginBottom: 20,
    alignItems: 'center'
  },
  frameImage: {
    width: 250,
    height: 350,
    borderRadius: 10,
    resizeMode: 'cover'
  },
  frameLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default AIScreen;
