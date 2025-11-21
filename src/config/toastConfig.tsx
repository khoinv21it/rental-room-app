import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BaseToast, ErrorToast } from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={styles.successToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </View>
      )}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={styles.errorToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </View>
      )}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={styles.infoToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
        </View>
      )}
    />
  ),
};

const styles = StyleSheet.create({
  successToast: {
    borderLeftColor: "#10B981",
    borderLeftWidth: 5,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    height: 70,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  errorToast: {
    borderLeftColor: "#EF4444",
    borderLeftWidth: 5,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    height: 70,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  infoToast: {
    borderLeftColor: "#3B82F6",
    borderLeftWidth: 5,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    height: 70,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  contentContainer: {
    paddingHorizontal: 15,
  },
  iconContainer: {
    justifyContent: "center",
    paddingLeft: 15,
  },
  text1: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    letterSpacing: 0.2,
  },
  text2: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 2,
  },
});
