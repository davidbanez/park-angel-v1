import '@testing-library/jest-dom'

// Mock React Native modules for web testing
Object.defineProperty(global.navigator, 'product', {
  value: 'ReactNative',
  writable: true,
});

// Mock Expo modules
vi.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

vi.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: vi.fn(),
    goBack: vi.fn(),
  }),
}));

vi.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

vi.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));