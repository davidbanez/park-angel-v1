# Park Angel - Comprehensive Parking Management System

A comprehensive parking management ecosystem consisting of four interconnected applications built on a modern, scalable architecture.

## Project Structure

This is a monorepo containing the following packages:

### Applications

- **`packages/admin-dashboard`** - Web application for super admin management
- **`packages/operator-dashboard`** - Web and mobile application for parking operators
- **`packages/client-mobile`** - React Native with Expo app for parking customers
- **`packages/pos-mobile`** - React Native with Expo app for iOS and Android POS operations
- **`packages/shared`** - Shared types, utilities, and components

## Technology Stack

- **Frontend Web**: React 18+ with TypeScript, Vite, TailwindCSS
- **Frontend Mobile**: React Native with Expo SDK 49+ (iOS and Android)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: Zustand with React Query for server state
- **Navigation**: React Router (web), React Navigation (mobile)
- **UI Components**: Custom component library with purple theme
- **Maps**: Google Maps API with custom styling
- **Payments**: Stripe, PayPal, local payment gateways

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd park-angel-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Husky hooks:
   ```bash
   npm run prepare
   ```

### Development

- **Start all applications**: `npm run dev`
- **Build all applications**: `npm run build`
- **Run tests**: `npm run test`
- **Lint code**: `npm run lint`
- **Format code**: `npm run format`
- **Type check**: `npm run type-check`

### Working with Individual Packages

Navigate to any package directory and run package-specific commands:

```bash
cd packages/admin-dashboard
npm run dev
```

## Code Quality

This project uses:

- **TypeScript** with strict mode for type safety
- **ESLint** for code linting with React and React Native specific rules
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **lint-staged** for running linters on staged files

## Git Workflow

- Pre-commit hooks run ESLint and Prettier on staged files
- Pre-push hooks run type checking and tests
- All code must pass linting and type checking before commits

## Architecture

The system follows Clean Architecture principles with:

1. **Presentation Layer**: React/React Native components
2. **Application Layer**: Use cases and application services
3. **Domain Layer**: Business entities and domain services
4. **Infrastructure Layer**: Supabase integration and external APIs

## Contributing

1. Create a feature branch from `develop`
2. Make your changes following the coding standards
3. Ensure all tests pass and code is properly formatted
4. Submit a pull request

## License

Private - All rights reserved