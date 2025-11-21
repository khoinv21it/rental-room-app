import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import StackNavigator from "./src/screens/StackNavigator";
import { toastConfig } from "./src/config/toastConfig";

export default function App() {
  return (
    <>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });
