import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import useAuthStore from "../../../Stores/useAuthStore";
import { useNavigation } from "@react-navigation/native";

const HomeScreen: React.FC = () => {
  const user = useAuthStore((s) => s.loggedInUser);
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Welcome to the Rental Room App</Text>
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Hello, {user.username}!</Text>
          <Text style={styles.userEmail}>{user.userProfile.fullName}</Text>
        </View>
      )}
      <Button
        title="Logout"
        onPress={async () => {
          await useAuthStore.getState().logOut();
          // Navigate to login screen or show a message
          navigation.navigate("LoginScreen");
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  userInfo: {
    marginTop: 20,
    alignItems: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 16,
    color: "#888",
  },
});

export default HomeScreen;
