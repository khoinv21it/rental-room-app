import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import HomeScreen from "../StackNavigator/Screens/HomeScreen";
import { View, Text } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import ManageScreen from "./Screens/ManageScreen";
import HomeScreen from "./Screens/HomeScreen";
import FavoriteScreen from "./Screens/FavoriteScreen";
import ProfileScreen from "./Screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let name: React.ComponentProps<typeof Icon>["name"] = "circle";
          switch (route.name) {
            case "Home":
              name = "home-outline";
              break;
            case "Favorites":
              name = "heart-outline";
              break;
            case "Profile":
              name = "account-outline";
              break;
            case "Manage":
              name = "briefcase-outline";
              break;
            default:
              name = "circle";
          }
          return <Icon name={name} size={22} color={color} />;
        },
        tabBarActiveTintColor: "#4f8ef7",
        tabBarInactiveTintColor: "#8892a6",
        tabBarStyle: { height: 60, paddingBottom: 6, paddingTop: 6 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoriteScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Manage" component={ManageScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
