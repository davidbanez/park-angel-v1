import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { usePOSSession } from '../hooks/usePOSSession';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { hasActiveSession, isLoading: sessionLoading } = usePOSSession();

  useEffect(() => {
    if (authLoading || sessionLoading) return;

    if (!user) {
      router.replace('/(auth)/login');
    } else if (!hasActiveSession) {
      router.replace('/(auth)/shift-start');
    } else {
      router.replace('/(pos)/dashboard');
    }
  }, [user, hasActiveSession, authLoading, sessionLoading, router]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#7C3AED'
    }}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={{ 
        color: '#fff', 
        fontSize: 18, 
        marginTop: 16,
        fontWeight: '600'
      }}>
        Park Angel POS
      </Text>
      <Text style={{ 
        color: '#E5E7EB', 
        fontSize: 14, 
        marginTop: 8
      }}>
        Loading...
      </Text>
    </View>
  );
}