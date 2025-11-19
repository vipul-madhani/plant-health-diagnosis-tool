import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications';

// Screens
import HomeScreen from '../screens/HomeScreen';
import AgronomistRegistrationScreen from '../screens/AgronomistRegistrationScreen';
import ReportPurchaseScreen from '../screens/ReportPurchaseScreen';
import ConsultationBookingScreen from '../screens/ConsultationBookingScreen';
import ChatScreen from '../screens/ChatScreen';
import AgronomistDashboardScreen from '../screens/AgronomistDashboardScreen';
import AgronomistProfileScreen from '../screens/AgronomistProfileScreen';
import UserReportsScreen from '../screens/UserReportsScreen';
import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// User Types
type UserRole = 'user' | 'agronomist' | null;

export interface AppNavigatorProps {}

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animationEnabled: false }}
      />
      <Stack.Screen
        name="AgronomistRegistration"
        component={AgronomistRegistrationScreen}
        options={{ title: 'Become an Agronomist' }}
      />
    </Stack.Navigator>
  );
};

const UserTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Diagnose',
          tabBarLabel: 'Diagnose',
        }}
      />
      <Tab.Screen
        name="Reports"
        component={UserReportsScreen}
        options={{
          title: 'My Reports',
          tabBarLabel: 'Reports',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AgronomistProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const AgronomistTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AgronomistDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Consultations"
        component={ConsultationBookingScreen}
        options={{
          title: 'Consultations',
          tabBarLabel: 'Consultations',
        }}
      />
      <Tab.Screen
        name="AgronomistProfile"
        component={AgronomistProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const RootStack = ({ userRole, isLoading }: { userRole: UserRole; isLoading: boolean }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      {isLoading ? (
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animationEnabled: false }}
        />
      ) : userRole ? (
        <Stack.Group screenOptions={{ headerShown: false }}>
          {userRole === 'user' ? (
            <>
              <Stack.Screen
                name="UserApp"
                component={UserTabs}
              />
              <Stack.Screen
                name="ReportPurchase"
                component={ReportPurchaseScreen}
                options={{ title: 'Purchase Report' }}
              />
              <Stack.Screen
                name="ConsultationBook"
                component={ConsultationBookingScreen}
                options={{ title: 'Book Consultation' }}
              />
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{ title: 'Consultation Chat' }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="AgronomistApp"
                component={AgronomistTabs}
              />
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{ title: 'Consultation Chat' }}
              />
            </>
          )}
        </Stack.Group>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthStack}
        />
      )}
    </Stack.Navigator>
  );
};

const AppNavigator: React.FC<AppNavigatorProps> = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      // Restore token
      const savedUserRole = await AsyncStorage.getItem('userRole');
      const authToken = await AsyncStorage.getItem('authToken');

      if (authToken && savedUserRole) {
        setUserRole(savedUserRole as UserRole);
      }
    } catch (e) {
      console.error('Failed to restore token:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup Firebase Notifications
  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Request permission
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }
  };

  return (
    <NavigationContainer>
      <RootStack userRole={userRole} isLoading={isLoading} />
    </NavigationContainer>
  );
};

export default AppNavigator;
