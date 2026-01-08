# Jiggy Care Mobile - Healthcare Consultant App

A premium React Native mobile application for healthcare consultants built with Expo and TypeScript.

## Features

- 🔐 **Authentication** - Login with email/password or Google Sign-In
- 🏠 **Dashboard** - Overview with stats and upcoming appointments
- 📅 **Appointments** - View, filter, and manage patient appointments
- 💬 **Chat** - Real-time messaging with patients (per appointment)
- 💊 **Prescriptions** - Create and manage patient prescriptions
- 👤 **Profile** - Manage profile settings and preferences
- 🌙 **Dark Mode** - System-aware theme switching

## Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **Navigation**: React Navigation 6
- **Animations**: React Native Reanimated
- **UI Components**: Custom component library

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app (iOS/Android)

### Installation

```bash
cd jiggycare
npm install
```

### Running the App

```bash
npx expo start
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

### Running on Simulators

```bash
# iOS
npx expo start --ios

# Android
npx expo start --android
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── navigation/     # Navigation configuration
├── screens/        # Screen components
│   ├── auth/       # Authentication screens
│   ├── home/       # Home/Dashboard screens
│   ├── appointments/  # Appointments & Chat
│   ├── prescriptions/ # Prescriptions
│   └── profile/    # Profile & Settings
├── stores/         # Zustand state stores
├── theme/          # Design system
├── types/          # TypeScript types
└── utils/          # Utilities
```

## Design System

- **Primary Color**: #0583D2 (Deep Blue)
- **Secondary Color**: #FF7F50 (Coral)
- **Font**: Inter
- **Dark Mode**: Automatic system preference

## API Integration

The app includes mock data for development. Replace with your API endpoints in:
- `src/stores/authStore.ts`
- `src/stores/chatStore.ts`
- `src/stores/appointmentsStore.ts`

## License

MIT
