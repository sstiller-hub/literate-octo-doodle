# PWA Setup for iPhone

Your health analytics app is now configured as a Progressive Web App (PWA) that can be installed on iPhones!

## 📱 What's Been Added

### 1. **App Icon**
- SVG icon created at `/public/icon.svg`
- Features a readiness gauge (75%) with pulse line and gradient background
- Blue gradient design (#3b82f6 to #1d4ed8)

### 2. **PWA Manifest** (`/public/manifest.json`)
- App name: "Readiness Tracker"
- Configured for standalone display (no browser UI)
- Portrait orientation optimized for mobile

### 3. **Meta Tags** (`/index.html`)
- Apple-specific PWA meta tags
- Theme color configuration
- Viewport settings for iPhone safe areas

### 4. **Service Worker** (`/public/sw.js`)
- Enables offline functionality
- Caches app assets for faster loading
- Auto-registered in App.tsx

---

## 🎨 Generating PNG Icons (Required Step)

iOS requires PNG icons (SVG won't work). You need to create these files:

### Required Icon Sizes:
- `icon-180.png` (180×180) - Apple Touch Icon
- `icon-192.png` (192×192) - Standard PWA icon
- `icon-512.png` (512×512) - High-res PWA icon
- `apple-touch-icon.png` (180×180) - Fallback

### Option 1: Use RealFaviconGenerator (Recommended)
1. Go to https://realfavicongenerator.net/
2. Upload `/public/icon.svg`
3. Select "iOS" and "Web App Manifest" options
4. Download the generated icons
5. Place them in `/public/` directory

### Option 2: Use ImageMagick (Command Line)
```bash
# Install ImageMagick first
brew install imagemagick  # macOS
# or: apt-get install imagemagick  # Linux

# Convert SVG to PNG at different sizes
convert -background none public/icon.svg -resize 180x180 public/icon-180.png
convert -background none public/icon.svg -resize 192x192 public/icon-192.png
convert -background none public/icon.svg -resize 512x512 public/icon-512.png
cp public/icon-180.png public/apple-touch-icon.png
```

### Option 3: Use Figma/Sketch/Photoshop
1. Open `/public/icon.svg` in your design tool
2. Export as PNG at 180×180, 192×192, and 512×512
3. Save to `/public/` directory

---

## 📲 Installing on iPhone

Once you have PNG icons generated:

### For Users:
1. Open the app in **Safari** (not Chrome!)
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Confirm the name and tap **"Add"**

The app will now appear on your iPhone home screen with the custom icon!

### Features After Installation:
- ✅ Opens in fullscreen (no Safari UI)
- ✅ Appears as separate app in app switcher
- ✅ Works offline (cached assets)
- ✅ Faster load times
- ✅ iPhone safe area support (no notch overlap)

---

## 🧪 Testing PWA Features

### Check PWA Readiness:
1. Open Chrome DevTools (desktop)
2. Go to **Lighthouse** tab
3. Run "Progressive Web App" audit
4. Should score 100% after icons are added

### Test on iPhone:
1. Deploy to a HTTPS URL (required for service workers)
2. Open in Safari on iPhone
3. Install via "Add to Home Screen"
4. Test offline mode by turning on Airplane Mode

---

## 🚀 Next Steps

### Before Going Live:
1. ✅ Generate PNG icons (see instructions above)
2. ✅ Deploy to HTTPS domain (Vercel/Netlify/etc)
3. ✅ Test installation on real iPhone
4. Consider adding splash screens (optional)
5. Consider adding screenshots to manifest (optional)

### Optional Enhancements:
- **Splash Screens**: Add launch screens for smoother startup
- **Push Notifications**: Enable training reminders
- **Shortcuts**: Add quick actions from home screen icon
- **Share Target**: Allow sharing data from other apps

---

## 🔧 Customization

### Change App Name:
Edit `/public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Short Name"
}
```

### Change Theme Color:
Edit `/public/manifest.json` and `/index.html`:
```json
"theme_color": "#your-color-hex"
```

### Change Icon Design:
Edit `/public/icon.svg` then regenerate PNG files.

---

## 🐛 Troubleshooting

### Icon Not Showing on iPhone:
- Ensure PNG files exist (SVG won't work on iOS)
- Icons must be exactly 180×180, 192×192, 512×512
- Clear Safari cache and reinstall

### App Not Working Offline:
- Check browser console for service worker errors
- Ensure app is served over HTTPS
- Service workers don't work on localhost in Safari

### Manifest Not Loading:
- Check file path in index.html is `/manifest.json`
- Ensure manifest.json is valid JSON (no trailing commas)
- Check network tab for 404 errors

---

## 📚 Resources

- [Apple PWA Guidelines](https://developer.apple.com/design/human-interface-guidelines/web-apps)
- [PWA Builder](https://www.pwabuilder.com/)
- [Maskable Icons](https://maskable.app/editor) - Create adaptive icons
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
