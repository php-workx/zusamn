# Quickstart: Zusamn MVP1

## Prerequisites

- Node.js (v18+)
- pnpm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Xcode (iOS) or Android Studio (Android)
- Firebase Project (Console)

## Setup

1.  **Clone & Install**
    ```bash
    git clone <repo>
    cd zusamn
    pnpm install
    ```

2.  **Environment Variables**
    Copy `.env.example` to `.env` and fill in:
    ```bash
    cp .env.example .env
    # Add FIREBASE_API_KEY, etc.
    ```

3.  **Firebase Config**
    - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) from Firebase Console.
    - Place them in `apps/mobile/`.
    - Example placeholders live in `apps/mobile/google-services.json.example` and `apps/mobile/GoogleService-Info.plist.example`.
    - Do not commit real Firebase config files.

## Development

**Note**: You must use a **Development Build** (EAS), not Expo Go, because of native dependencies (Auth, Deep Links).

1.  **Build Dev Client**
    ```bash
    cd apps/mobile
    eas build --profile development --platform ios # or android
    ```
    Install the resulting binary on your simulator/device.

2.  **Start Bundler**
    ```bash
    pnpm dev
    ```
    Press `i` (iOS) or `a` (Android) to connect to the installed Dev Client.

## Testing

- **Unit Tests**: `pnpm test`
- **Linting**: `pnpm lint`
