import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#7C3AED',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'POS Login',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="shift-start" 
        options={{ 
          title: 'Start Shift',
          headerBackVisible: false
        }} 
      />
      <Stack.Screen 
        name="biometric-setup" 
        options={{ 
          title: 'Biometric Setup'
        }} 
      />
    </Stack>
  );
}