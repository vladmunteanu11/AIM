# Assets și Imagini - Template Primărie Digitală

## Structura Folderelor

### 1. Frontend Assets (Static)
```
frontend/public/assets/
├── logo-primarie.png      # Logo oficial al primăriei
├── favicon.ico           # Favicon pentru browser
├── hero-background.jpg   # Imagine de fundal pentru homepage
└── ...                   # Alte imagini statice
```

### 2. Backend Uploads (Dynamic)
```
backend/uploads/
├── assets/              # Imagini încărcate prin admin
├── documents/           # Documente publice
└── temp/               # Fișiere temporare
```

## Cum să Adaugi Imagini

### Imagini Statice (Logo, Favicon, etc.)

1. **Copiază imaginea în folderul corespunzător:**
   ```bash
   cp your-logo.png frontend/public/assets/logo-primarie.png
   ```

2. **Actualizează fișierul .env:**
   ```bash
   LOGO_URL="/assets/logo-primarie.png"
   ```

3. **Restartează aplicația pentru a vedea schimbările**

### Imagini Dinamice (prin Admin Panel)

1. **Utilizează interfața admin** pentru upload
2. **Imaginile se salvează automat în** `backend/uploads/assets/`
3. **URL-urile se generează automat** și se salvează în baza de date

## Formaturi Acceptate

- **Logo:** PNG, SVG (recomandată rezoluția: 200x80px)
- **Favicon:** ICO, PNG (16x16, 32x32, 64x64px)
- **Hero Background:** JPG, PNG (recomandată rezoluția: 1920x1080px)

## Optimizare Imagini

Pentru performanță optimă:
- Comprimă imaginile înainte de upload
- Folosește formaturi moderne (WebP unde e posibil)
- Dimensiuni recomandate pentru web

## Accesare în Frontend

```tsx
// Imagini statice
<img src="/assets/logo-primarie.png" alt="Logo Primărie" />

// Imagini dinamice (din API)
<img src={municipalityConfig.logo_url} alt="Logo" />
```
