# 🧠 SmartSearch – AI-Powered Multimodal Product Search

**SmartSearch** is a next-gen product search engine that lets you search using text, voice, or images. It cuts through the noise of hundreds of similar listings in online marketplaces to help you find exactly what you're looking for. Whether you're trying to buy a specific charger, trousers, headphones, or any other product—SmartSearch combines the power of **Google Gemini's multimodal AI** and **MongoDB vector search** to deliver accurate, relevant results.

---

## 🚀 Features

- 🔍 **Search via Image, Voice, or Text**
- 🧠 **Gemini AI** to analyze images and generate precise queries
- 🧮 **MongoDB Atlas Vector Search** for finding semantically similar products
- ☁️ **Google Cloud Storage** for uploading user images
- 🎯 **Filtered & Context-Aware Results**
- ⚡ **Fast and Flexible UI** built with Next.js and Tailwind

---

## 🛠️ Tech Stack

### Backend
- **Flask (Python)** – REST API
- **MongoDB Atlas** – Vector search
- **Google Gemini API** – Multimodal AI (image + text)
- **Google Cloud Storage** – Image uploads

### Frontend
- **Next.js (TypeScript)** – React-based frontend
- **Tailwind CSS** – Styling
- **Voice Input**, **Drag-and-Drop Image Upload**

---

## 📷 Use Case

> You saw a black slim-fit trouser in a video.  
> You upload the image in SmartSearch.  
> Gemini processes it and describes it accurately.  
> Vector search kicks in and returns top matching products.  
> No need to scroll through pages of irrelevant items!

---

## 🧪 How It Works

```plaintext
[User Input: Image, Voice, or Text]
        ⬇️
  [Flask Backend API - Python]
        ⬇️
[Google Gemini Multimodal AI]
    ➤ Converts images into queries
        ⬇️
[Metadata Filtering + Vector Embedding]
        ⬇️
[MongoDB Atlas Vector Search]
        ⬇️
[Top Matching Results]
        ⬇️
[Next.js Frontend Display]

