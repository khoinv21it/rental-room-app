import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import HomeScreen from "../StackNavigator/Screens/HomeScreen";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import ManageScreen from "./screens/ManageScreen";
import HomeScreen from "./screens/HomeScreen";
import FavoriteScreen from "./screens/FavoriteScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MessageScreen from "./screens/MessageScreen";
import { useNotifications } from "../../hooks/useNotifications";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { unreadCount } = useNotifications();

  console.log("🔴 TabNavigator unreadCount:", unreadCount);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ color, size, focused }) => {
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
            case "Message":
              name = "message-text-outline";
              break;
            case "Manage":
              name = "briefcase-outline";
              break;
            default:
              name = "circle";
          }

          return (
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconWrapper,
                  focused
                    ? styles.iconWrapperActive
                    : styles.iconWrapperInactive,
                ]}
              >
                <Icon name={name} size={20} color={focused ? "#fff" : color} />
              </View>
              {/* Badge chấm đỏ khi có thông báo chưa đọc ở Profile */}
              {route.name === "Profile" && unreadCount > 0 && (
                <View style={styles.badge} />
              )}
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.tabLabel, focused && styles.tabLabelActive]}
              >
                {route.name}
              </Text>
            </View>
          );
        },
        tabBarActiveTintColor: "#4f8ef7",
        tabBarInactiveTintColor: "#8892a6",
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoriteScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Message" component={MessageScreen} />
      <Tab.Screen name="Manage" component={ManageScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 10,
    height: 68,
    borderRadius: 18,
    backgroundColor: "rgba(11,17,32,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    paddingHorizontal: 8,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    height: "100%",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    transform: [{ translateY: 0 }],
  },
  iconWrapperActive: {
    backgroundColor: "#60a5fa", // modern blue accent (shadcn-like)
    shadowColor: "#60a5fa",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ translateY: -6 }],
  },
  iconWrapperInactive: {
    backgroundColor: "transparent",
    transform: [{ translateY: 16 }],
  },
  tabLabel: {
    fontSize: 11,
    color: "#94a3b8", // muted slate-like color
    letterSpacing: 0.2,
    maxWidth: 72,
    textAlign: "center",
    lineHeight: 14,
    transform: [{ translateY: 8 }],
  },
  tabLabelActive: {
    color: "#e6f6ff", // near-white with cool tint
    fontWeight: "600",
    transform: [{ translateY: -6 }],
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444", // red badge
    borderWidth: 2,
    borderColor: "#0b1120",
    zIndex: 10,
  },
});
