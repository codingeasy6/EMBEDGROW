# EMBEDGROW - Official Static Website

**Tagline:** CREATE. CONNECT. GROW.  
**Core Positioning:** Professional Websites & Project Solutions

---

## 🚀 Overview

EMBEDGROW is a technology startup / digital solutions website built using **HTML5**, **CSS3**, and **JavaScript**. 

The website communicates **two equal core services**:
1. **Website Development** (Business, Startup, Portfolio, Educational, Landing Pages, Custom Websites)
2. **School & College Projects** (Science Projects, Mini Projects, Final-Year Projects, IoT, Embedded Systems, Robotics, Web, Android, AI/ML)

---

## 📂 Project Structure

```text
embedgrow/
├── index.html          # Home Page (Split Hero, Equal Services, Portfolio, Process, Tech)
├── services.html       # Services Overview Page
├── projects.html       # Projects Showcase with JavaScript Category Filtering
├── about.html          # About EMBEDGROW Page (Mission & Vision)
├── contact.html        # Interactive Contact Form & Options
├── css/
│   └── style.css       # Design System & Responsive Stylesheet
├── js/
│   └── script.js       # Dynamic Links, Navigation Toggle, Portfolio Filter, Form Validation
└── README.md           # Project Documentation
```

---

## 💬 WhatsApp Button Configuration

The website includes a floating WhatsApp contact button fixed at the bottom-right corner of every page (`58px × 58px`, `#25D366`, with hover tooltip and official SVG icon).

To set your actual WhatsApp phone number:
1. Open `js/script.js`.
2. Locate the configuration variable at the top:
   ```javascript
   const WHATSAPP_NUMBER = "YOUR_NUMBER";
   ```
3. Replace `"YOUR_NUMBER"` with your country code + phone number (e.g., `"15550192834"` or `"919876543210"`).
4. Save the file. All WhatsApp buttons across `Home`, `Services`, `Projects`, `About`, and `Contact` will automatically link to your WhatsApp chat!

---

## 🎨 Brand Design System

- **Deep Navy:** `#071A2B`
- **Teal / Cyan:** `#0B7285`
- **Orange (CTA):** `#FF641C`
- **White:** `#FFFFFF`
- **Light Gray:** `#F5F7FA`
- **Dark Gray:** `#111827`
- **Typography:** `Inter` Google Font

---

## 🌐 Deployment Options

This website is 100% static and can be deployed instantly to:

1. **GitHub Pages:**
   - Push code to a GitHub repository.
   - Go to `Settings` -> `Pages` -> Select `main` branch -> Save.

2. **Netlify:**
   - Drag and drop the `embedgrow/` folder into Netlify Drop.

3. **Vercel:**
   - Import the repository via Vercel Dashboard.

4. **Traditional Web Hosting:**
   - Upload all files via FTP/cPanel to `public_html`.
