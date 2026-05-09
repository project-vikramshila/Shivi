# Shivi AI - Desktop Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Prerequisites Check
```bash
node --version  # Must be 20+
npm --version   # Must be 10+
git --version
```

### 2. Clone & Install (2 min)
```bash
git clone https://github.com/project-vikramshila/Shivi.git
cd Shivi
npm install
```

### 3. Configure (1 min)
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey):
```
GEMINI_API_KEY=your_key_here
```

### 4. Run (30 sec)
```bash
npm run dev
```

**Done!** Electron window opens automatically.

---

## 🎮 Using Shivi

### Voice Commands
- Click the **voice orb** (center of screen)
- Speak: *"Suno Shivi"* or *"Hey Shivi"*
- Try: *"Kal Rahul ko call karna"* (Hindi reminder)

### Create Automation
1. Click **Automation** tab
2. Grant app permissions
3. Say: *"Open Chrome and search for weather"*

### Test Reminders
1. Click **Reminders** tab
2. Say: *"Mujhe kal 10 baje reminder do"*
3. View in dashboard

### Chat with Memory
- Type or speak in Hindi/English
- Shivi learns context
- Check **Memory** tab for insights

---

## 📊 Development Commands

```bash
# Start dev mode (hot reload)
npm run dev

# Check for errors
npm run type-check

# Run all tests (94 tests)
npm test

# Run validation suite
npm run validate

# View production logs
tail -f logs/shivi.log

# Build for Windows distribution
npm run dist:win
```

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| Module not found | `npm install` |
| Port 3000 taken | Close other apps on port 3000 |
| Gemini API error | Check `.env` GEMINI_API_KEY value |
| DevTools hidden | Press `F12` |
| Blank screen | Wait 5 sec, check DevTools console |

---

## 📁 Project Layout

```
src/
├── main/          Electron bootstrap
├── renderer/      React UI (Glassmorphism)
├── modules/       AI, voice, automation, memory
├── security/      Hardening & encryption
├── logging/       Centralized logs
└── monitoring/    Crash reporting
```

---

## 🚀 Next: Production Build

```bash
npm run build              # Compile all code
npm run dist:win           # Create installer
npm run release:stable     # Publish release
```

Installers appear in `dist_electron/`.

---

## 📞 Support

- **Logs**: `logs/shivi.log`
- **Tests**: `npm run validate`
- **Issues**: Check console with `F12`

**Start now**: `npm run dev`
