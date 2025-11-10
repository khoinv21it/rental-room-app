import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import useAuthStore from "../../../Stores/useAuthStore";

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [secure, setSecure] = useState(true);
  const [remember, setRemember] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const login = useAuthStore((s) => s.login);
  const storeError = useAuthStore((s) => s.error);

  type FormValues = { username: string; password: string };
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setGeneralError(null);
    await login({
      username: data.username,
      password: data.password,
      onSuccess: () => {
        reset();
        navigation.navigate("HomeScreen");
      },
      onError: (err: any) => {
        const message =
          typeof err === "string"
            ? err
            : err?.response?.data?.message ||
              err?.message ||
              "Đăng nhập thất bại";
        setGeneralError(message);
      },
    });
    console.log("Login attempted");

    // also show any latest store error
    const latest = useAuthStore.getState().error;
    if (latest) {
      setGeneralError(
        typeof latest === "string" ? latest : JSON.stringify(latest)
      );
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

            <Text style={styles.title}>Chào mừng đến với RentalRoom</Text>
            <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

            <View style={styles.form}>
              <Controller
                control={control}
                name="username"
                rules={{ required: "Vui lòng nhập email hoặc số điện thoại" }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Email hoặc số điện thoại"
                    placeholderTextColor="#9aa0a6"
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                rules={{
                  required: "Vui lòng nhập mật khẩu",
                  minLength: {
                    value: 6,
                    message: "Mật khẩu tối thiểu 6 ký tự",
                  },
                }}
                render={({ field: { onChange, value }, fieldState }) => (
                  <View style={styles.passwordRow}>
                    <TextInput
                      placeholder="Mật khẩu"
                      placeholderTextColor="#9aa0a6"
                      style={[styles.input, { flex: 1 }]}
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={secure}
                    />
                    <TouchableOpacity
                      onPress={() => setSecure((s) => !s)}
                      style={styles.showBtn}
                    >
                      <Text style={styles.showText}>
                        {secure ? "Hiện" : "Ẩn"}
                      </Text>
                    </TouchableOpacity>
                    {fieldState.error && (
                      <Text style={{ color: "#ff6666", marginTop: 6 }}>
                        {fieldState.error.message}
                      </Text>
                    )}
                  </View>
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
                  <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate("LoginHelp")}
                >
                  <Text style={styles.forgot}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              {generalError || storeError ? (
                <Text style={{ color: "#ff8a80", marginBottom: 8 }}>
                  {generalError ??
                    (typeof storeError === "string"
                      ? storeError
                      : storeError?.message ?? JSON.stringify(storeError))}
                </Text>
              ) : null}

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleSubmit(onSubmit)}
              >
                <Text style={styles.loginText}>Đăng nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.googleBtn}
                onPress={() => {
                  // TODO: tích hợp Google Sign-In
                  navigation.navigate("HomeScreen");
                }}
              >
                <View style={styles.googleIcon}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.googleText}>Đăng nhập với Google</Text>
              </TouchableOpacity>

              <View style={styles.signUpRow}>
                <Text style={styles.noAcc}>Chưa có tài khoản?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                >
                  <Text style={styles.signUp}> Đăng ký ngay</Text>
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
    marginBottom: 12,
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
});

export default LoginScreen;
