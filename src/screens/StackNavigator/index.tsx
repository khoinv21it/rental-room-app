import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import TabNavigator from "../TabNavigator";
import EditProfileScreen from "../TabNavigator/screens/EditProfileScreen";
import NotificationScreen from "../TabNavigator/screens/NotificationScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserProfile } from "../../types/types";

// Define the param list for the stack navigator
export type RootStackParamList = {
  LoginScreen: undefined;
  HomeScreen: undefined;
  EditProfileScreen: {
    userProfile?: UserProfile;
    onProfileUpdated?: (profile: UserProfile) => void;
  };
  NotificationScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Navigator
        initialRouteName="LoginScreen"
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeScreen"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditProfileScreen"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NotificationScreen"
          component={NotificationScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
};
export default StackNavigator;
