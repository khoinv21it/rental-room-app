import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fontSize, layout, normalize, spacing } from "../utils/responsive";
import Toast from "react-native-toast-message";

interface OTPVerificationModalProps {
  visible: boolean;
  email: string;
  generatedOTP: string;
  onClose: () => void;
  onVerifySuccess: () => void;
}

const OTPVerificationModal = ({
  visible,
  email,
  generatedOTP,
  onClose,
  onVerifySuccess,
}: OTPVerificationModalProps) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage("");
    }

    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const enteredOTP = otp.join("");

    if (enteredOTP.length !== 6) {
      setErrorMessage("Vui lòng nhập đầy đủ 6 số");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");

    // Simulate verification delay
    setTimeout(() => {
      if (enteredOTP === generatedOTP) {
        setIsVerifying(false);
        setErrorMessage("");
        onVerifySuccess();
      } else {
        setIsVerifying(false);
        setErrorMessage("Mã OTP không chính xác. Vui lòng thử lại.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    }, 500);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>OTP Verification</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={50} color="#4A90E2" />
            </View>

            <Text style={styles.description}>
              Verification code has been sent to email:
            </Text>
            <Text style={styles.email}>{email}</Text>

            <Text style={styles.otpLabel}>Enter OTP (6 numbers):</Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    errorMessage && styles.otpInputError,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#F44336" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.verifyButton,
                isVerifying && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              Note: Check your spam folder if you don't see the email
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: normalize(20),
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: "#333",
  },
  modalBody: {
    padding: layout.screenPadding,
    alignItems: "center",
  },
  iconContainer: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: fontSize.md,
    color: "#666",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  email: {
    fontSize: fontSize.md,
    color: "#4A90E2",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  otpLabel: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: "#333",
    marginBottom: spacing.md,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: normalize(45),
    height: normalize(50),
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: normalize(8),
    fontSize: fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
    color: "#333",
  },
  otpInputError: {
    borderColor: "#F44336",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: spacing.md,
    borderRadius: normalize(8),
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: "#F44336",
    flex: 1,
    fontWeight: "500",
  },
  verifyButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["3xl"],
    borderRadius: normalize(12),
    minWidth: normalize(150),
    alignItems: "center",
    marginBottom: spacing.md,
  },
  verifyButtonDisabled: {
    backgroundColor: "#ccc",
  },
  verifyButtonText: {
    fontSize: fontSize.lg,
    color: "#fff",
    fontWeight: "700",
  },
  note: {
    fontSize: fontSize.sm,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default OTPVerificationModal;
