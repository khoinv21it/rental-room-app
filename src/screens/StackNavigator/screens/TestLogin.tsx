import * as React from "react";
import { Button, View, Text, StyleSheet, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const TestLogin: React.FC = () => {
  const [userInfo, setUserInfo] = React.useState<any>(null);

  // --- Web Client ID (dùng cho Expo Go)
  const webClientId =
    "790557500394-3q2bhaegqsfhvv63oct8jt5k4s5iudg5.apps.googleusercontent.com";

  // --- Khởi tạo request với redirectUri dùng proxy (HTTPS)
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    redirectUri: makeRedirectUri({ scheme: "rental-room-app" }), // chỉ tạo URI hợp lệ
    // Thêm proxy riêng khi promptAsync nếu cần
  });
  // --- Log thông tin request
  React.useEffect(() => {
    if (request) {
      console.log("=== Google Auth Request ===");
      console.log("Platform:", Platform.OS);
      console.log("Client ID:", request.clientId);
      console.log("Redirect URI:", request.redirectUri);
      console.log("Scopes:", request.scopes);
      console.log("===========================");
    }
  }, [request]);

  // --- Handle response từ Google
  React.useEffect(() => {
    if (!response) return;

    console.log("=== Google Auth Response ===", response);

    if (response.type === "success") {
      const { id_token } = response.params;

      try {
        // Decode ID token
        const base64Url = id_token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);

        setUserInfo(decoded);
        console.log("Decoded user info:", decoded);

        Alert.alert(
          "Login Success!",
          `Welcome ${decoded.name || decoded.email}!`
        );
      } catch (error) {
        console.error("Error decoding token:", error);
        Alert.alert("Login Failed", "Error decoding token");
      }
    } else if (response.type === "dismiss") {
      console.log("⚠️ Login dismissed by user");
    } else if (response.type === "error") {
      console.error("Login error:", response);
      Alert.alert("Login Failed", response.error?.message || "Unknown error");
    }
  }, [response]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Test Google Login</Text>

        {/* Nút đăng nhập Google */}
        <Button
          title="Sign in with Google"
          onPress={() => promptAsync()}
          disabled={!request}
        />

        {/* Hiển thị thông tin user nếu login thành công */}
        {userInfo && (
          <View style={styles.userInfo}>
            <Text style={styles.infoTitle}>✅ Logged In Successfully!</Text>
            <Text style={styles.infoText}>Name: {userInfo.name}</Text>
            <Text style={styles.infoText}>Email: {userInfo.email}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { flex: 1, justifyContent: "center", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  userInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2e7d32",
  },
  infoText: { fontSize: 14, color: "#333" },
});

export default TestLogin;
