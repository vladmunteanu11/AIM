# Template Primărie Digitală - Diagrame Frontend

## 1. 🏗️ Arhitectura Frontend

```mermaid
graph TB
    subgraph "Frontend Architecture"
        A[React 19 App] --> B[React Router]
        A --> C[Material-UI Theme]
        A --> D[TypeScript]
        
        B --> E[Public Routes]
        B --> F[Admin Routes]
        B --> G[Auth Routes]
        
        C --> H[DigiLocal Theme]
        C --> I[Custom Components]
        
        E --> J[HomePage]
        E --> K[ServiciiOnline]
        E --> L[FormulareOnline]
        E --> M[ProgramariOnline]
        
        F --> N[Dashboard]
        F --> O[ComplaintsAdmin]
        F --> P[FormsAdmin]
        
        I --> Q[AnimatedCard]
        I --> R[GradientButton]
        I --> S[FloatingActionButton]
    end
    
    subgraph "External Services"
        T[Mock Services]
        U[Real Backend API]
        V[Ghișeul.ro]
    end
    
    A --> T
    A --> U
    A --> V
```

## 2. 📁 Structura Componentelor

```mermaid
graph TD
    subgraph "Components Structure"
        A[src/] --> B[components/]
        A --> C[pages/]
        A --> D[services/]
        A --> E[hooks/]
        A --> F[styles/]
        A --> G[types/]
        
        B --> H[layout/]
        B --> I[admin/]
        B --> J[forms/]
        B --> K[ui/]
        
        H --> L[Header.tsx]
        H --> M[Footer.tsx]
        H --> N[Breadcrumbs.tsx]
        
        K --> O[AnimatedCard.tsx]
        K --> P[GradientButton.tsx]
        K --> Q[FloatingActionButton.tsx]
        
        I --> R[AdminLayout.tsx]
        I --> S[AdminSidebar.tsx]
        I --> T[AdminStats.tsx]
        
        C --> U[public/]
        C --> V[admin/]
        
        U --> W[HomePage.tsx]
        U --> X[ServiciiOnlinePage.tsx]
        U --> Y[FormulareOnlinePage.tsx]
        U --> Z[ProgramariOnlinePage.tsx]
        
        V --> AA[DashboardPage.tsx]
        V --> BB[ComplaintsManagement.tsx]
        V --> CC[ConfigurationPage.tsx]
    end
```

## 3. 🎨 Design System Flow

```mermaid
graph LR
    subgraph "DigiLocal Design System"
        A[Brand Guidelines] --> B[Color Palette]
        A --> C[Typography]
        A --> D[Components]
        
        B --> E[Primary: #004990<br/>PANTONE 280C]
        B --> F[Secondary: #0079C1<br/>PANTONE 300C]
        B --> G[Background: #F8FAFC]
        
        C --> H[Trebuchet MS<br/>Main Font]
        C --> I[Trajan Pro<br/>Official Titles]
        
        D --> J[Modern Cards]
        D --> K[Gradient Buttons]
        D --> L[Glass Morphism]
        
        E --> M[Themed Components]
        F --> M
        G --> M
        H --> M
        I --> M
        J --> M
        K --> M
        L --> M
        
        M --> N[Material-UI Theme]
        N --> O[Styled Components]
        O --> P[Final UI]
    end
```

## 4. 🔄 State Management Flow

```mermaid
graph TB
    subgraph "State Management"
        A[User Action] --> B[Component State]
        B --> C[React Hooks]
        
        C --> D[useState]
        C --> E[useEffect]
        C --> F[Custom Hooks]
        
        F --> G[useMunicipalityConfig]
        F --> H[useAuth]
        
        D --> I[Local State]
        E --> J[Side Effects]
        G --> K[Global Config]
        H --> L[Auth State]
        
        I --> M[Component Re-render]
        J --> N[API Calls]
        K --> O[Context Provider]
        L --> P[Route Protection]
        
        N --> Q[Services Layer]
        Q --> R[Mock Services]
        Q --> S[Real API]
        
        R --> T[Local Data]
        S --> U[Backend Data]
        
        T --> V[UI Update]
        U --> V
    end
```

## 5. 🚦 User Journey - Sesizări

```mermaid
flowchart TD
    A[Cetățean acces Homepage] --> B[Click 'Servicii Online']
    B --> C[Selectează 'Sesizări și Reclamații']
    C --> D[Vizualizează categorii disponibile]
    D --> E[Selectează categoria potrivită]
    E --> F[Completează formularul]
    
    F --> G{Validare formular}
    G -->|Invalid| H[Afișare erori]
    H --> F
    G -->|Valid| I[Submit sesizare]
    
    I --> J[Generare număr referință]
    J --> K[Afișare confirmare]
    K --> L[Email confirmare]
    
    L --> M[Cetățean poate urmări<br/>statusul sesizării]
    
    subgraph "Admin Flow"
        N[Admin primește notificare]
        N --> O[Procesare sesizare]
        O --> P[Actualizare status]
        P --> Q[Notificare cetățean]
    end
    
    I --> N
    Q --> M
```

## 6. 📋 Form Handling Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant S as FormsService
    participant V as Validation
    participant M as Mock API
    
    U->>C: Selectează tip formular
    C->>S: getFormTypes()
    S->>M: Fetch mock data
    M-->>S: Return form types
    S-->>C: Form types loaded
    C-->>U: Display available forms
    
    U->>C: Selectează formular specific
    C->>S: getFormTypeBySlug(slug)
    S->>M: Get form schema
    M-->>S: Return form schema
    S-->>C: Form schema loaded
    C-->>U: Display dynamic form
    
    U->>C: Completează și submit
    C->>V: Validate form data
    V-->>C: Validation result
    
    alt Valid Data
        C->>S: createFormSubmission(data)
        S->>M: Create submission
        M-->>S: Success + reference number
        S-->>C: Submission created
        C-->>U: Success message + reference
    else Invalid Data
        C-->>U: Display errors
    end
```

## 7. 🎯 Component Interaction

```mermaid
graph TD
    subgraph "Header Component"
        A[Header.tsx] --> B[ContactBar]
        A --> C[Navigation]
        A --> D[SearchBar]
        A --> E[MobileMenu]
        
        B --> F[Municipality Info]
        C --> G[Navigation Items]
        D --> H[Search Function]
        E --> I[Responsive Menu]
    end
    
    subgraph "Page Components"
        J[ServiciiOnlinePage] --> K[Service Cards]
        J --> L[Category Tabs]
        J --> M[Information Panels]
        
        N[FormulareOnlinePage] --> O[Form Types Grid]
        N --> P[Instructions]
        N --> Q[Requirements Info]
    end
    
    subgraph "Shared UI Components"
        R[AnimatedCard] --> S[Hover Effects]
        R --> T[Transition Animations]
        
        U[GradientButton] --> V[Modern Styling]
        U --> W[Interactive States]
        
        X[FloatingActionButton] --> Y[Fixed Position]
        X --> Z[Action Triggers]
    end
    
    A --> J
    A --> N
    K --> R
    O --> R
    G --> U
    P --> U
```

## 8. 📱 Responsive Breakpoints

```mermaid
graph LR
    subgraph "Device Breakpoints"
        A[xs: 0px<br/>Mobile Portrait] --> B[sm: 600px<br/>Mobile Landscape]
        B --> C[md: 900px<br/>Tablet]
        C --> D[lg: 1200px<br/>Desktop]
        D --> E[xl: 1536px<br/>Large Desktop]
    end
    
    subgraph "Layout Changes"
        F[Mobile<br/>- Hamburger menu<br/>- Single column<br/>- Stacked cards] 
        G[Tablet<br/>- Partial navigation<br/>- 2 column grid<br/>- Compact spacing]
        H[Desktop<br/>- Full navigation<br/>- 3+ column grid<br/>- Full spacing]
    end
    
    A --> F
    B --> F
    C --> G
    D --> H
    E --> H
```

## 9. 🔐 Authentication Flow

```mermaid
flowchart TD
    A[User Access] --> B{Is Authenticated?}
    B -->|No| C[Redirect to Login]
    B -->|Yes| D{Check Role}
    
    C --> E[Login Form]
    E --> F[Submit Credentials]
    F --> G{Valid Credentials?}
    G -->|No| H[Show Error]
    H --> E
    G -->|Yes| I[Generate JWT Token]
    I --> J[Store in localStorage]
    J --> D
    
    D --> K{Role Check}
    K -->|Admin| L[Admin Dashboard]
    K -->|Super Admin| M[Super Admin Panel]
    K -->|User| N[Public Interface]
    
    subgraph "Protected Routes"
        O[Admin Routes]
        P[User Routes]
        Q[Public Routes]
    end
    
    L --> O
    M --> O
    N --> P
    B -->|Public| Q
```

## 10. ⚡ Performance Optimization

```mermaid
graph TB
    subgraph "Performance Strategies"
        A[Code Splitting] --> B[Lazy Loading]
        A --> C[Bundle Splitting]
        
        D[Caching] --> E[Service Worker]
        D --> F[Memory Cache]
        D --> G[LocalStorage]
        
        H[Asset Optimization] --> I[Image Compression]
        H --> J[Font Loading]
        H --> K[CSS Minification]
        
        L[Runtime Optimization] --> M[React.memo]
        L --> N[useMemo/useCallback]
        L --> O[Virtual Scrolling]
    end
    
    subgraph "Loading Strategies"
        P[Critical CSS] --> Q[Above Fold]
        R[Progressive Loading] --> S[Below Fold]
        T[Skeleton Loading] --> U[User Feedback]
    end
    
    B --> P
    C --> R
    E --> T
    M --> U
```

## 11. 🔄 Service Layer Architecture

```mermaid
graph TD
    subgraph "Services Architecture"
        A[API Service Base] --> B[HTTP Client (Axios)]
        A --> C[Error Handling]
        A --> D[Request Interceptors]
        A --> E[Response Interceptors]
        
        F[FormsService] --> A
        G[ComplaintsService] --> A
        H[AppointmentsService] --> A
        I[AuthService] --> A
        
        F --> J[Mock Forms Data]
        G --> K[Mock Complaints Data]
        H --> L[Mock Appointments Data]
        
        J --> M[getFormTypes()]
        J --> N[createSubmission()]
        K --> O[getCategories()]
        K --> P[createComplaint()]
        L --> Q[getServices()]
        L --> R[bookAppointment()]
        
        subgraph "Development Mode"
            S[Mock Responses]
            T[Simulated Delays]
            U[Error Simulation]
        end
        
        M --> S
        N --> T
        O --> S
        P --> T
        Q --> U
        R --> S
    end
```

## 12. 🎨 Theme System Architecture

```mermaid
graph LR
    subgraph "Theme Architecture"
        A[DigiLocal Brand] --> B[Color Definitions]
        A --> C[Typography Scale]
        A --> D[Component Overrides]
        
        B --> E[Primary Colors<br/>#004990, #0079C1]
        B --> F[Semantic Colors<br/>Success, Warning, Error]
        B --> G[Neutral Colors<br/>Grays, Backgrounds]
        
        C --> H[Font Families<br/>Trebuchet MS, Trajan Pro]
        C --> I[Font Sizes<br/>h1-h6, body1-body2]
        C --> J[Font Weights<br/>400, 500, 600, 700]
        
        D --> K[MUI Button<br/>Gradient, Border Radius]
        D --> L[MUI Card<br/>Shadows, Hover Effects]
        D --> M[MUI TextField<br/>Focus States, Colors]
        
        E --> N[Material-UI Theme]
        F --> N
        G --> N
        H --> N
        I --> N
        J --> N
        K --> N
        L --> N
        M --> N
        
        N --> O[Styled Components]
        O --> P[Final UI Components]
    end
```

---

## 📊 Legenda Simboluri

- 🏗️ **Arhitectură** - Structura generală
- 📁 **Componente** - Organizarea fișierelor
- 🎨 **Design** - Sistem de design
- 🔄 **State** - Management de stare
- 🚦 **Flow** - Fluxuri utilizator
- 📋 **Forms** - Gestionarea formularelor
- 🎯 **Interacțiuni** - Comunicarea între componente
- 📱 **Responsive** - Design adaptiv
- 🔐 **Auth** - Autentificare
- ⚡ **Performance** - Optimizări
- 🔄 **Services** - Servicii backend
- 🎨 **Theme** - Sistem de tematizare

**Toate diagramele sunt în format Mermaid și pot fi vizualizate în GitHub, GitLab, sau orice editor care suportă Mermaid.**