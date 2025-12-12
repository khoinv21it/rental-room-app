import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import StackNavigator from "./src/screens/StackNavigator";
import { toastConfig } from "./src/config/toastConfig";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";

export default function App() {
  const navigationRef = useRef<any>(null);
  const notificationResponse =
    useRef<Notifications.NotificationResponse | null>(null);

  useEffect(() => {
    // Check if app was opened from a notification (when app was killed)
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          console.log("🚀 [App] App opened from notification:", response);
          notificationResponse.current = response;
        }
      })
      .catch((error) => {
        console.error(
          "❌ [App] Error getting last notification response:",
          error
        );
      });
  }, []);

  // Handle navigation when NavigationContainer is ready
  const handleNavigationReady = () => {
    console.log("✅ [App] Navigation ready");

    // If app was opened from notification, handle it now
    if (notificationResponse.current && navigationRef.current) {
      const data =
        notificationResponse.current.notification.request.content.data;
      const type = data?.type as string;

      console.log("🎯 [App] Handling notification from killed state:", type);

      // Wait a bit more to ensure everything is mounted
      setTimeout(() => {
        handleNotificationNavigation(data, navigationRef.current);
      }, 1000);

      // Clear the notification response
      notificationResponse.current = null;
    }
  };

  return (
    <>
      <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
        <StackNavigator />
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
}

// Helper function to handle notification navigation
function handleNotificationNavigation(data: any, navigation: any) {
  try {
    const type = data?.type as string;
    const contractId = data?.contractId as string;
    const partnerId = data?.partnerId as string;
    const partnerName = data?.partnerName as string;

    console.log("🎯 [App] Navigating to:", type);

    switch (type) {
      case "booking_success":
        navigation.navigate("RentalHistoryScreen");
        break;
      case "request_success":
        navigation.navigate("RequestStatusScreen");
        break;
      case "resident_success":
        navigation.navigate("ResidentsScreen");
        break;
      case "payment_success":
        if (contractId) {
          navigation.navigate("ContractOverviewScreen", {
            contractId,
            initialTab: "bills",
          });
        }
        break;
      case "new_message":
        if (partnerId) {
          navigation.navigate("MessageScreen", {
            partnerId,
            partnerName: partnerName || "User",
          });
        } else {
          navigation.navigate("MessageScreen");
        }
        break;
      default:
        navigation.navigate("NotificationScreen");
        break;
    }
    console.log("✅ [App] Navigation completed");
  } catch (error) {
    console.error("❌ [App] Navigation error:", error);
  }
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });
