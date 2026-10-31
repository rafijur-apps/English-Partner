# English Partner (ইংরেজি পার্টনার)

Complete, production-ready, cross-platform Mobile App built with Flutter & Dart for Bangladeshi & South Asian learners of Spoken English and Vocabulary.

## 🌟 Key Features

1. **🗣️ বাক্য প্র্যাকটিস (Sentence Practice)**
   - 500 Categorized Spoken English Sentences with authentic Bengali translations.
   - Clean paginated layout (10 or 12 cards per page).
   - "🔊 শুনুন" (Listen) using `flutter_tts` configured with rate: 0.88 for crisp enunciation.
   - "🎙️ দেখে বলুন" (Practice Speech) using `speech_to_text` with South Asian `en_IN` locale to tolerate Bangladeshi English phonetics without strict native rhotic penalties.
   - Levenshtein & token-overlap fuzzy matching algorithm with 0.65 similarity threshold.
   - Live speech card feedback: "You said: [transcript]", green check badge ("✅ দারুণ উচ্চারণ!"), or retry badge ("⚠️ আবার বলুন").
   - Top & bottom pagination bars with jump-to-page input and live search across English & Bengali.

2. **📝 শব্দ ভাণ্ডার ও টেস্ট (Vocabulary & MCQ Test)**
   - 500 Essential Vocabulary words with parts of speech, categories, and Bengali meanings.
   - Range Selector Bar: Presets (1-50, 51-100, ..., 1-500) + Custom Range input.
   - Sub-tab A: 📚 শব্দ ভাণ্ডার (Study List with audio pronunciation and search).
   - Sub-tab B: 🎯 ৪-অপশন এমসিকিউ টেস্ট (MCQ Test with 1 correct + 3 random distractors).
   - Auto-advance in 1.2s on correct answers with success chimes/haptics.
   - In-depth study review on wrong answers before advancing.
   - End-of-Quiz Summary Card with performance analytics.

3. **🎨 Design & Theme**
   - Dark Mode by default (`#0F172A` background, `#1E293B` card surface, `#38BDF8` accent) with smooth Light Mode toggle.
   - Bengali Google Fonts (`Hind Siliguri`).
   - Clean footer credit: "This app made by Md. Rafijur Rahman (Zuboraj)".
   - Local state persistence via `shared_preferences`.

## 🚀 How to Run Flutter App

```bash
cd flutter_project
flutter pub get
flutter run
```
