import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@env";
import { Feather as Icon } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  Keyboard,
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
import * as yup from "yup";
import { registerUser } from "../../../Services/Auth";

const schema = yup
  .object({
    fullName: yup
      .string()
      .min(3, "Full name must be at least 3 characters")
      .required("Please enter your full name"),
    email: yup
      .string()
      .email("Please enter a valid email address")
      .required("Please enter your email"),
    username: yup
      .string()
      .min(3, "Username must be at least 3 characters")
      .required("Please enter phone number or email"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Please enter your password"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match")
      .required("Please confirm your password"),
  })
  .required();

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [secure, setSecure] = useState(true);
  const [remember, setRemember] = useState(false);

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID, // From Google Cloud Console
      offlineAccess: true, // If you want to access Google API on behalf of the user FROM YOUR SERVER
      forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
      iosClientId: GOOGLE_OAUTH_CLIENT_ID, // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
    });
  }, []);

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
    Keyboard.dismiss();
    try {
      const response = await registerUser(
        data.fullName,
        data.email,
        data.username,
        data.password
      );
      Toast.show({
        type: "success",
        position: "top",
        text1: "Registration Successful",
        text2: "You have successfully registered.",
        visibilityTime: 4000,
        autoHide: true,
        topOffset: 50,
        bottomOffset: 40,
      });
      reset();
      navigation.navigate("LoginScreen");

      const rs = response.data || response;
      console.log("Registration successful:", rs);
    } catch (error: any) {
      const errorData = error?.response?.data || error;
      const errorMessage = errorData?.message;

      // Handle message as array or string
      const displayMessage = Array.isArray(errorMessage)
        ? errorMessage[0]
        : errorMessage || "Registration failed. Please try again.";

      showError(displayMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("../../../../assets/logo-ant.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Welcome to Ant</Text>
          <Text style={styles.subtitle}>Register to continue</Text>

          {/* Using native Toast (Android) or Alert (iOS) to show errors */}

          <View style={styles.form}>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value }, fieldState }) => (
                <>
                  <TextInput
                    placeholder="Full Name"
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
              name="email"
              render={({ field: { onChange, value }, fieldState }) => (
                <>
                  <TextInput
                    placeholder="Email"
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
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value }, fieldState }) => (
                <>
                  <TextInput
                    placeholder="Confirm Password"
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
                    secureTextEntry={secure}
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

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.loginText}>Register</Text>
            </TouchableOpacity>

            <Text
              style={{ color: "#cbd5df", textAlign: "center", marginTop: 12 }}
            >
              Do you have an account?
              <Text
                style={{ color: "#fff", fontWeight: "700" }}
                onPress={() => navigation.navigate("LoginScreen")}
              >
                Sign in here
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DADCE0",
    marginBottom: 12,
  },

  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  googleLogo: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },

  googleText: {
    fontSize: 15,
    color: "#3C4043",
    fontWeight: "500",
  },

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

export default RegisterScreen;
