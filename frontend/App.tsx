import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importăm ecranele noastre modulare
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';

// Definim structura stivei de navigare
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      {/* initialRouteName setează primul ecran care se deschide */}
      <Stack.Navigator initialRouteName="Login">
        {/* Ecranul de Login (fără bară superioară pentru un design modern) */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* Ecranul de Register */}
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* Ecranul Principal (aici ajungem doar după login) */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Citatele Mele', headerBackVisible: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}