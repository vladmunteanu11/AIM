# Ghid de Culori și Contrast - DigiLocal Platform

## Paletă de Culori Principale

### Culori Brand (PANTONE conform PDF DigiLocal)
- **Primary Blue**: `#004990` (PANTONE 280C)
- **Secondary Blue**: `#0079C1` (PANTONE 300C)
- **Primary Dark**: `#002855`
- **Secondary Light**: `#29B6F6`

### Culori Text (pentru contrast optim)
- **Text Principal**: `#212121` - Aproape negru, contrast maxim pe fundal alb
- **Text Secundar**: `#424242` - Gri închis, pentru text mai puțin important
- **Text Disabled**: `#9E9E9E` - Gri mediu, pentru elemente inactive
- **Text pe Fundal Întunecat**: `#FFFFFF` - Alb pur

### Culori Fundal
- **Background Default**: `#F8FAFC` - Gri foarte deschis
- **Background Paper**: `#FFFFFF` - Alb pur pentru carduri
- **Background Accent**: `#F1F8FF` - Albastru foarte deschis
- **Background Dark**: `#212121` - Pentru footer și secțiuni dark

## Reguli de Contrast (WCAG 2.1 Level AA)

### Ratio-uri Minime
- **Text normal** (< 18px): minim 4.5:1
- **Text mare** (≥ 18px sau bold ≥ 14px): minim 3:1
- **Elemente UI interactive**: minim 3:1

### Combinații Recomandate

#### Pe Fundal Alb (#FFFFFF)
✅ **Excelent contrast:**
- Text: `#212121` (ratio: 16.1:1)
- Text secundar: `#424242` (ratio: 10.7:1)
- Primary blue: `#004990` (ratio: 8.6:1)
- Links: `#0079C1` (ratio: 5.1:1)

❌ **Contrast slab - EVITAT:**
- Gri deschis pe alb: `#E0E0E0` (ratio: 1.3:1)
- Albastru deschis: `#29B6F6` (ratio: 2.1:1)

#### Pe Fundal Închis (#212121)
✅ **Excelent contrast:**
- Text alb: `#FFFFFF` (ratio: 16.1:1)
- Text gri deschis: `#E0E0E0` (ratio: 12.6:1)

#### Pe Gradient Albastru
✅ **Pentru gradient primary (#004990 → #0079C1):**
- Folosim doar text alb `#FFFFFF` (ratio: 8.6:1 - 5.1:1)

## Utilizare în Componente

### Navigation Bar (Header)
```typescript
Background: #FFFFFF (alb)
Text: #212121 (negru)
Logo text: #004990 (albastru)
Hover state: #0079C1 (albastru secundar)
Search input bg: #F5F5F5 (gri deschis)
```

### Contact Bar (Top Bar)
```typescript
Background: linear-gradient(135deg, #004990, #0079C1)
Text: #FFFFFF (alb) !important
Icons: #FFFFFF (alb)
```

### Butoane
```typescript
// Primary Button
Background: linear-gradient(45deg, #004990, #0079C1)
Text: #FFFFFF
Hover: Darker gradient with scale transform

// Secondary Button (Outlined)
Border: #004990 (2px)
Text: #004990
Background: transparent
Hover bg: rgba(0, 73, 144, 0.08)

// Text Button
Text: #212121
Hover bg: rgba(0, 73, 144, 0.06)
```

### Cards și Panouri
```typescript
Background: #FFFFFF
Border: rgba(0, 73, 144, 0.08)
Title: #212121
Body text: #424242
Shadow: 0 4px 20px rgba(0, 73, 144, 0.08)
```

### Form Inputs
```typescript
Background: rgba(0, 73, 144, 0.02)
Border: rgba(0, 73, 144, 0.12)
Text: #212121
Placeholder: #757575
Focus border: #004990
Focus bg: rgba(0, 73, 144, 0.06)
```

### Footer
```typescript
Background: linear-gradient(135deg, #212121, #424242)
Text primary: #FFFFFF
Text secondary: #E0E0E0
Links: #29B6F6
Hover links: #FFFFFF
```

## Testare Contrast

### Tool-uri Recomandate
1. **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
2. **Chrome DevTools**: Lighthouse Accessibility Audit
3. **axe DevTools**: Browser extension pentru testing
4. **Color Contrast Analyzer**: Desktop app

### Checklist Verificare
- [ ] Text principal pe fundal alb: min 4.5:1
- [ ] Text principal pe fundal color: min 4.5:1
- [ ] Butoane și links: min 4.5:1
- [ ] Icons interactive: min 3:1
- [ ] Focus indicators: min 3:1
- [ ] Placeholder text: min 4.5:1

## Erori Comune de Evitat

### ❌ NU Folosi
- Text gri deschis (#9E9E9E sau mai deschis) pe fundal alb
- Text albastru deschis (#29B6F6) pe fundal alb
- Text alb pe fundal galben sau deschis
- Gradiente text (text-gradient) fără fallback solid color

### ✅ Folosi În Schimb
- Text întunecat (#212121, #424242) pe fundal deschis
- Text alb (#FFFFFF) pe fundal întunecat sau colorat
- Culori solid definite pentru toate elementele text
- Hover states cu contrast îmbunătățit

## Accesibilitate

### Cerințe WCAG 2.1 Level AA
- [x] Contrast text normal: 4.5:1
- [x] Contrast text mare: 3:1
- [x] Contrast componente UI: 3:1
- [x] Contrast hover/focus states: 3:1
- [x] Indicatori focus vizibili

### Considerații Suplimentare
- Evitați să folosiți doar culoarea pentru a transmite informații
- Asigurați-vă că toate elementele interactive au indicatori focus vizibili
- Testați cu simulări de daltonism
- Verificați vizibilitatea în condiții de lumină puternică

## Actualizări și Întreținere

**Ultima actualizare**: Octombrie 2025

**Reviewer periodic**: Testați contrastul la fiecare:
- Adăugare de componente noi
- Schimbare de culori în temă
- Update major de design
- Rapoarte de accesibilitate

---

Pentru întrebări sau sugestii de îmbunătățire a acestui ghid, contactați echipa de dezvoltare.
