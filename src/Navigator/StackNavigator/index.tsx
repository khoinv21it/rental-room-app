import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./Screens/LoginScreen";
import HomeScreen from "./Screens/HomeScreen";

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="LoginScreen"
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: "#f4511e" },
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
        component={HomeScreen}
        options={{ headerShown: true }}
      />
    </Stack.Navigator>
  );
};
export default StackNavigator;
