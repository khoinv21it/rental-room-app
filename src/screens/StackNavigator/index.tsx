import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import TabNavigator from "../TabNavigator";
import EditProfileScreen from "../TabNavigator/screens/EditProfileScreen";
import NotificationScreen from "../TabNavigator/screens/NotificationScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserProfile } from "../../types/types";
import TestLogin from "./screens/TestLogin";
import MapScreen from "./screens/MapScreen";
import MyContractsScreen from "./screens/MyContractsScreen";
import ContractOverviewScreen from "./screens/ContractOverviewScreen";
import RentalHistoryScreen from "./screens/RentalHistoryScreen";
import RequestStatusScreen from "./screens/RequestStatusScreen";
import ResidentsScreen from "./screens/ResidentsScreen";
import ResidentsDetailView from "./screens/ResidentsDetailView";
import RoomDetailScreen from "./screens/RoomDetailScreen";
import RentalRoomView from "../../components/RentalRoomView";
import RegisterScreen from "./screens/RegisterScreen";

// Define the param list for the stack navigator a
export type RootStackParamList = {
  LoginScreen: undefined;
  HomeScreen: undefined;
  RegisterScreen: undefined;
  TestLogin: undefined;
  EditProfileScreen: {
    userProfile?: UserProfile;
    onProfileUpdated?: (profile: UserProfile) => void;
  };
  NotificationScreen: undefined;
  MapScreen: undefined;
  MyContractsScreen: undefined;
  RentalHistoryScreen: undefined;
  RequestStatusScreen: undefined;
  ResidentsScreen: undefined;
  ResidentsDetailView: {
    resident: {
      id: string;
      fullName: string;
      idNumber: string;
      relationship: string;
      startDate: string;
      endDate: string;
      note?: string;
      status: string;
      contractId: string;
      idCardFrontUrl?: string;
      idCardBackUrl?: string;
    };
  };
  RoomDetailScreen:
    | {
        roomId?: string;
      }
    | undefined;
  RentalRoomView: {
    booking: any;
    onRefresh?: () => void;
  };
  ContractOverviewScreen: {
    contractId: string;
  };
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
          name="RegisterScreen"
          component={RegisterScreen}
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
        <Stack.Screen
          name="TestLogin"
          component={TestLogin}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MapScreen"
          component={MapScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyContractsScreen"
          component={MyContractsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RentalHistoryScreen"
          component={RentalHistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RequestStatusScreen"
          component={RequestStatusScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ResidentsScreen"
          component={ResidentsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ResidentsDetailView"
          component={ResidentsDetailView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RoomDetailScreen"
          component={RoomDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RentalRoomView"
          component={RentalRoomView}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ContractOverviewScreen"
          component={ContractOverviewScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
};
export default StackNavigator;
