# 🌟 English Partner (ইংরেজি পার্টনার)

> **বাংলা ভাষাভাষীদের জন্য সম্পূর্ণ স্পোকেন ইংলিশ ও ভোকাবুলারি টেস্ট ওয়েব প্ল্যাটফর্ম**  
> Created by **Md. Rafijur Rahman (Zuboraj)**

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

---

## 🚀 বৈশিষ্ট্যসমূহ (Key Features)

1. **🗣️ বাক্য প্র্যাকটিস (500 Spoken English Sentences)**
   - ৫০০টি ক্যাটাগরিভিত্তিক বাক্য (Conversational, Daily Life, Workplace, Data & Tech, Job Interview)।
   - প্রতিটি বাক্যের নির্ভুল বাংলা অনুবাদ।
   - **🔊 শুনুন (Listen)**: মাল্টি-টিয়ার টেক্সট-টু-স্পিচ (TTS) অডিও উচ্চারণ।
   - **🎙️ দেখে বলুন (Practice Speech)**: সাউথ এশিয়ান ও বাংলাদেশি অ্যাকসেন্ট সহনশীল মাইক্রোফোন স্পিচ রিকগনিশন।
   - লাইভ ফেডব্যাক: দারুণ উচ্চারণ (✅) বা আবার বলুন (⚠️)।
   - ১০/১২/২০ বাক্য প্রতি পেজ ও রিয়েল-টাইম সার্চ।

2. **📝 শব্দ ভাণ্ডার ও কুইজ (500 Vocabulary & MCQ Test)**
   - ৫০০টি অতি প্রয়োজনীয় শব্দ, পার্টস অফ স্পিচ ও বাংলা অর্থ।
   - রেঞ্জ সিলেক্টর (১-৫০, ৫১-১০০ ... ১-৫০০)।
   - **🎯 ৪-অপশন এমসিকিউ টেস্ট**:
     - ১টি সঠিক উত্তর + ৩টি র‍্যান্ডম ডিস্ট্রাক্টর অপশন।
     - সঠিক হলে ১.২ সেকেন্ডে স্বয়ংক্রিয়ভাবে পরবর্তী প্রশ্নে চলে যাবে।
     - ভুল হলে সঠিক উত্তর লাল/সবুজ ব্যাজে দেখিয়ে স্টাডির সুযোগ দেওয়া হয়।
     - কুইজ শেষে স্কোর ও পারফরম্যান্স বিশ্লেষণ।

3. **📊 আমার অগ্রগতি (Progress & Analytics)**
   - বাক্য সমাপ্তির রিয়েল-টাইম ট্র্যাকার।
   - প্রিয় শব্দ ভাণ্ডার ও বুকমার্ক করা বাক্যের সংগ্রহশালা।

4. **⚡ টেকনিক্যাল স্পেসিফিকেশন**
   - **Framework**: React 19 + TypeScript + Vite + Tailwind CSS.
   - **Theme**: ডার্ক মোড ডিফল্ট (`#0F172A`) এবং স্মুথ লাইট মোড সুইচ।
   - **Offline PWA**: সার্ভিস ওয়ার্কার এবং ম্যানিফেস্ট দিয়ে ১০০% অফলাইন সাপোর্ট।
   - **Netlify Ready**: `netlify.toml` এবং `public/_redirects` আগেই কনফিগার করা।

---

## 🌐 Netlify-তে কীভাবে হোস্ট করবেন (How to Deploy on Netlify)

1. **GitHub-এ পুশ করুন**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - English Partner"
   git remote add origin https://github.com/your-username/english-partner.git
   git push -u origin main
   ```

2. **Netlify-তে কানেক্ট করুন**:
   - [Netlify.com](https://www.netlify.com)-এ যান এবং আপনার GitHub দিয়ে লগইন করুন।
   - **"Add new site" > "Import an existing project" > "GitHub"** সিলেক্ট করুন।
   - আপনার রিপোজিটরিটি পছন্দ করুন।

3. **স্বয়ংক্রিয় বিল্ড সেটিংস**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   *(আমাদের `netlify.toml` থাকায় এগুলো নিজে থেকেই সেট হয়ে যাবে)*

4. **Deploy Site** চাপলেই আপনার সাইট লাইভ হয়ে যাবে!

---

## 💻 লোকাল ডেভেলপমেন্ট (Local Development)

```bash
# ডিপেন্ডেন্সি ইনস্টল করুন
npm install

# ডেভেলপমেন্ট সার্ভার চালু করুন (port 3000)
npm run dev

# প্রোডাকশন বিল্ড তৈরি করুন
npm run build
```

---

## 📱 Flutter মোবাইল অ্যাপ (Mobile Project)

এই রিপোজিটরির `/flutter_project` ডিরেক্টরিতে সম্পূর্ণ Flutter/Dart সোর্স কোড অন্তর্ভুক্ত রয়েছে।
```bash
cd flutter_project
flutter pub get
flutter run
```

---

### 👨‍💻 কারিগর ও নির্মাতা (Author)
**Md. Rafijur Rahman (Zuboraj)**  
*English Partner Platform Creator*
