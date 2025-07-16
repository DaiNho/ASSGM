// File: utils/gemini.js

export const analyzeMood = async (message) => {
    const apiKey = 'AIzaSyAF4ZNnqHWkHbyBbvk0A_dVTBgEelI9uDo'; // <- THAY BẰNG API KEY CỦA BẠN
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = `Phân tích câu sau và trả về từ khóa cảm xúc phù hợp (ví dụ: vui, buồn, yêu, hài hước, ngạc nhiên, giận dữ): "${message}". Trả kết quả là danh sách từ khóa ngắn, không cần giải thích.`;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Tách từ khoá: có thể là chuỗi cách nhau bằng dấu phẩy hoặc xuống dòng
    return rawText
        .split(/,|\\n|\\-/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
};
