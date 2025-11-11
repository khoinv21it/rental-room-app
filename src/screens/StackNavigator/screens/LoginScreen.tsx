import { GOOGLE_OAUTH_CLIENT_ID } from "@env";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigation } from "@react-navigation/native";
import * as Google from "expo-auth-session/providers/google";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Feather as Icon } from "@expo/vector-icons";
import * as yup from "yup";
import useAuthStore from "../../../Stores/useAuthStore";
// import * as AuthSession from "expo-auth-session";

const schema = yup
  .object({
    username: yup
      .string()
      .min(3, "Username must be at least 3 characters")
      .required("Please enter phone number or email"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Please enter your password"),
  })
  .required();

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [secure, setSecure] = useState(true);
  const [remember, setRemember] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);

  // const redirectUri = AuthSession.makeRedirectUri({
  //   useProxy: false,
  // } as any);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_OAUTH_CLIENT_ID,
    androidClientId: GOOGLE_OAUTH_CLIENT_ID,
    iosClientId: GOOGLE_OAUTH_CLIENT_ID,
    scopes: ["profile", "email"],
    selectAccount: true,
    // redirectUri,
  });

  // useEffect(() => {
  //   console.log("👉 Redirect URI:", redirectUri);
  // }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      console.log("Google Sign-In Response:", response);
      handleGoogleSignIn(id_token);
    } else if (response?.type === "error") {
      console.error("Google Sign-In Error:", response.error);
      showError(
        "Google Sign-in failed: " + response.error?.message || "Unknown error"
      );
    }
  }, [response]);

  // Get auth state from store
  const accessToken = useAuthStore((s) => s.access_token);

  // Check if user is already logged in
  useEffect(() => {
    if (accessToken) {
      navigation.replace("HomeScreen");
    }
  }, [accessToken, navigation]);

  const showError = (msg: string) => {
    if (!msg) return;
    Toast.show({
      type: "error",
      position: "top",
      text1: "Authentication Error",
      text2: msg,
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
      bottomOffset: 40,
      props: {
        style: {
          borderLeftColor: "#FF392B",
          borderLeftWidth: 4,
          backgroundColor: "rgba(255, 57, 43, 0.1)",
        },
        contentContainerStyle: {
          paddingHorizontal: 15,
        },
        text1Style: {
          fontSize: 16,
          fontWeight: "600",
          color: "#FF392B",
        },
        text2Style: {
          fontSize: 14,
          color: "#FF392B",
        },
      },
    });
  };

  const login = useAuthStore((s) => s.login);
  const storeError = useAuthStore((s) => s.error);

  type FormValues = yup.InferType<typeof schema>;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { username: "", password: "" },
    resolver: yupResolver(schema),
    mode: "onBlur", // Validate when field loses focus
    reValidateMode: "onChange", // Re-validate on change
    criteriaMode: "all", // Show all validation errors
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await login({
        username: data.username,
        password: data.password,
        onSuccess: () => {
          reset();
          navigation.replace("HomeScreen");
        },
        onError: () => {
          // Get error message from the store
          const storeError = useAuthStore.getState().error;
          showError(storeError);
        },
      });
    } catch (error: any) {
      // For unexpected errors not handled by the store
      const errorMessage = "An unexpected error occurred. Please try again.";
      showError(errorMessage);
    }
  };

  const handleGoogleSignIn = async (id_token: string) => {
    try {
      console.log("Google Sign-In Response - ID Token:", id_token);

      // Send the token to your backend
      await useAuthStore.getState().loginWithGoogle({
        token: id_token,
        onSuccess: () => {
          navigation.replace("HomeScreen");
        },
        onError: (error) => {
          showError(error);
        },
      });
    } catch (error: any) {
      console.error("Google Sign-in error:", error);
      showError("Google Sign-in failed: " + (error.message || "Unknown error"));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.bg}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Image
              source={require("../../../../assets/logo-ant.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Welcome to Ant</Text>
            <Text style={styles.subtitle}>Login to continue</Text>

            {/* Using native Toast (Android) or Alert (iOS) to show errors */}

            <View style={styles.form}>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value }, fieldState }) => (
                  <>
                    <TextInput
                      placeholder="Enter Username"
                      placeholderTextColor="#9aa0a6"
                      style={[
                        styles.input,
                        fieldState.error && {
                          borderColor: "#ff6666",
                          borderWidth: 1,
                        },
                      ]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => {
                        onChange(value);
                      }} // Trigger validation on blur
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {fieldState.error && (
                      <View style={styles.fieldError}>
                        <Icon
                          name="alert-circle"
                          size={16}
                          color="#ff6666"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.fieldErrorText}>
                          {fieldState.error.message}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value }, fieldState }) => (
                  <>
                    <View style={styles.passwordRow}>
                      <TextInput
                        placeholder="Password"
                        placeholderTextColor="#9aa0a6"
                        style={[
                          styles.input,
                          { flex: 1 },
                          fieldState.error && {
                            borderColor: "#ff6666",
                            borderWidth: 1,
                          },
                        ]}
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => {
                          onChange(value);
                        }} // Trigger validation on blur
                        secureTextEntry={secure}
                      />
                      <TouchableOpacity
                        onPress={() => setSecure((s) => !s)}
                        style={styles.showBtn}
                      >
                        <Icon
                          name={secure ? "eye-off" : "eye"}
                          size={20}
                          color="#9aa0a6"
                        />
                      </TouchableOpacity>
                    </View>
                    {fieldState.error && (
                      <View style={styles.fieldError}>
                        <Icon
                          name="alert-circle"
                          size={16}
                          color="#ff6666"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.fieldErrorText}>
                          {fieldState.error.message}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              />
              <View style={styles.rowBetween}>
                <TouchableOpacity
                  style={styles.remember}
                  onPress={() => setRemember((r) => !r)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      remember ? styles.checkboxChecked : null,
                    ]}
                  />
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate("LoginHelp")}
                >
                  <Text style={styles.forgot}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleSubmit(onSubmit)}
              >
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={() => promptAsync()}
              >
                <View style={styles.googleIcon}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.googleText}>Sign in with Google</Text>
              </TouchableOpacity>
              <View style={styles.signUpRow}>
                <Text style={styles.noAcc}>Don't have an account?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                >
                  <Text style={styles.signUp}> Sign up now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071024" },
  bg: { flex: 1, backgroundColor: "linear-gradient(#071024, #0b1220)" },
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: { width: 180, height: 180, marginBottom: 10, borderRadius: 12 },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: { color: "#cbd5df", fontSize: 14, marginBottom: 18 },
  form: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 18,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  input: {
    height: 48,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#fff",
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 4, // Reduced to make room for error
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  showBtn: {
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  showText: { color: "#9aa0a6", fontWeight: "600" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  remember: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#9aa0a6",
    marginRight: 8,
  },
  checkboxChecked: { backgroundColor: "#4f8ef7", borderColor: "#4f8ef7" },
  rememberText: { color: "#cbd5df" },
  forgot: { color: "#9aa0a6", fontWeight: "600" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  googleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  googleG: { color: "#DB4437", fontWeight: "700" },
  googleText: { color: "#222", fontWeight: "600" },
  loginBtn: {
    backgroundColor: "#4f8ef7",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  loginText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  noAcc: { color: "#cbd5df" },
  signUp: { color: "#fff", fontWeight: "700" },
  fieldError: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
    backgroundColor: "rgba(255,77,77,0.1)",
    paddingVertical: 4,
    borderRadius: 4,
  },
  fieldErrorText: {
    color: "#ff6666",
    fontSize: 12,
    flex: 1,
  },
  banner: {
    // banner styles removed in favor of native Toast/Alert
  },
});

export default LoginScreen;
