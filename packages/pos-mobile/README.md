# Park Angel POS Mobile App

A comprehensive Point of Sale (POS) mobile application built with React Native and Expo for iOS and Android platforms. This app enables parking operators to manage on-site parking operations, handle cash transactions, and monitor compliance.

## Features

### 🔐 Authentication & Security
- Email/password authentication with Supabase
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- Two-factor authentication support
- Secure session management
- Auto-lock functionality

### 💰 Cash Management
- Shift start/end with cash validation
- Real-time cash tracking
- Cash drawer integration (iOS and Android compatible)
- Cash count and adjustment functionality
- End-of-shift reconciliation reports

### 🚗 Parking Operations
- Create parking sessions for walk-in customers
- License plate scanning with AI recognition
- Vehicle type selection and pricing
- Session management and termination
- Real-time occupancy monitoring

### 📱 Hardware Integration
- **Cash Drawer**: iOS (MFi certified) and Android (USB/Bluetooth) support
- **Receipt Printer**: Thermal printer connectivity for both platforms
- **Barcode/QR Scanner**: Camera-based and dedicated scanner support
- **Biometric Sensors**: Platform-specific biometric authentication

### 🚨 Violation Reporting
- Photo-based violation documentation
- License plate recognition for violations
- Multiple violation types (illegal parking, expired sessions, etc.)
- GPS location tagging
- Enforcement action requests (towing, clamping)

### 📊 Analytics & Reporting
- Real-time POS metrics dashboard
- Transaction history and analysis
- Cash flow tracking
- Performance monitoring
- Export capabilities

### 🔄 Offline Capabilities
- Offline-first architecture with local storage
- Automatic data synchronization when online
- Pending transaction queue
- Network status monitoring

## Platform-Specific Features

### iOS Features
- Face ID and Touch ID integration
- MFi certified cash drawer support
- iOS-specific hardware optimizations
- Native iOS UI components
- AirPrint support for receipts

### Android Features
- Fingerprint authentication
- USB OTG cash drawer connectivity
- Bluetooth hardware integration
- Android-specific permissions handling
- System print service integration

## Technology Stack

- **Framework**: React Native with Expo SDK 50+
- **Navigation**: Expo Router
- **State Management**: Zustand + React Query
- **UI Components**: React Native Paper
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Expo SecureStore + AsyncStorage
- **Camera**: Expo Camera + Vision Camera
- **Biometrics**: Expo Local Authentication
- **Printing**: Expo Print + native printer libraries
- **Offline**: React Query + AsyncStorage

## Hardware Requirements

### Minimum Requirements
- **iOS**: iPhone 8 or newer, iOS 13+
- **Android**: Android 8.0 (API level 26)+, 3GB RAM
- Camera with autofocus
- Bluetooth 4.0+ or USB OTG support

### Recommended Hardware
- Cash drawer with USB or Bluetooth connectivity
- Thermal receipt printer (58mm or 80mm)
- Barcode/QR code scanner (optional - camera fallback available)
- Biometric sensor (built into most modern devices)

## Installation

1. **Install dependencies**:
   ```bash
   cd packages/pos-mobile
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Run on device**:
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## Building for Production

### iOS Build
```bash
# Build for App Store
eas build --platform ios --profile production

# Build for TestFlight
eas build --platform ios --profile preview
```

### Android Build
```bash
# Build for Google Play Store
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile preview
```

## Configuration

### Hardware Setup

#### Cash Drawer Configuration
- **iOS**: Use MFi certified cash drawers with Lightning or USB-C connection
- **Android**: Configure USB OTG or Bluetooth cash drawers in settings

#### Receipt Printer Setup
- Connect thermal printer via Bluetooth or USB
- Configure printer settings in the app
- Test print functionality before going live

#### Scanner Configuration
- Camera-based scanning works out of the box
- For dedicated scanners, pair via Bluetooth in device settings

### App Configuration
- Configure Supabase connection in environment variables
- Set up push notification credentials
- Configure biometric authentication preferences
- Set cash drawer and printer connection parameters

## Security Features

- End-to-end encryption for sensitive data
- Secure storage for authentication tokens
- Biometric authentication for app access
- Session timeout and auto-lock
- Audit logging for all transactions
- Offline data encryption

## Compliance

- **BIR Compliance**: Philippine Bureau of Internal Revenue compliant receipts
- **PCI DSS**: No card data stored locally (cash-only transactions)
- **Data Privacy**: GDPR and local privacy law compliance
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design

## Support

For technical support and hardware compatibility questions:
- Email: support@parkangel.com
- Documentation: [Park Angel POS Docs](https://docs.parkangel.com/pos)
- Hardware Compatibility: [Supported Devices](https://docs.parkangel.com/pos/hardware)

## License

Copyright © 2024 Park Angel. All rights reserved.