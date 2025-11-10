import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import StackNavigator from "./src/Navigator/StackNavigator";

export default function App() {
  return (
    <>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
      <Toast />
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
