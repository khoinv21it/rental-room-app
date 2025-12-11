import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fontSize, layout, normalize, spacing } from "../utils/responsive";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { Bill, LandlordPaymentInfo } from "../types/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { uploadBillTransferImage } from "../Services/BillService";
import emailjs from "@emailjs/react-native";
import { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } from "@env";
import OTPVerificationModal from "./OTPVerificationModal";
import { useAuthStore } from "../Stores/useAuthStore";

interface PaymentModalProps {
  visible: boolean;
  infoLandlord: LandlordPaymentInfo;
  totalAmount: number;
  bill: Bill;
  onClose: () => void;
  onConfirm?: (bookingId: string) => void | Promise<void>;
}

const PaymentBill = ({
  visible,
  infoLandlord,
  bill,
  totalAmount,
  onClose,
  onConfirm,
}: PaymentModalProps) => {
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [imageUploadedSuccessfully, setImageUploadedSuccessfully] =
    useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  const { loggedInUser } = useAuthStore();

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please grant camera roll permissions to upload images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUploading(true);

      try {
        console.log("Uploading bill transfer image for bill:", bill.id);
        const response = await uploadBillTransferImage(bill.id, uri);
        console.log("Image upload response:", response);

        setUploadedImageUri(uri);
        setImageUploadedSuccessfully(true);

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Bill transfer image uploaded successfully!",
        });
      } catch (error: any) {
        console.error("Failed to upload image:", error);
        console.error("Upload error details:", error?.response?.data);

        setImageUploadedSuccessfully(false);

        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to upload image";

        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMessage,
        });
      } finally {
        setImageUploading(false);
      }
    }
  };

  const handleConfirmPayment = async () => {
    console.log("Confirming payment for bill:", bill.id);
    if (!transferConfirmed) {
      Alert.alert(
        "Confirmation Required",
        "Please confirm that you have completed the transfer"
      );
      return;
    }

    // Generate OTP and send email
    await sendOTPEmail();
  };

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOTPEmail = async () => {
    // Get email from user profile or use a default
    const userEmail = loggedInUser?.userProfile?.email;

    if (!userEmail) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User email not found",
      });
      return;
    }

    setIsSendingOTP(true);
    const otp = generateOTP();
    setGeneratedOTP(otp);

    try {
      const templateParams = {
        to_email: userEmail,
        to_name: loggedInUser?.userProfile?.fullName || "Customer",
        otp_code: otp,
        bill_month: bill?.month || "",
        amount: totalAmount?.toLocaleString("vi-VN"),
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
        publicKey: PUBLIC_KEY,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "OTP has been sent to your email",
      });

      setShowOTPModal(true);
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to send OTP. Please try again",
      });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleOTPVerifySuccess = () => {
    setShowOTPModal(false);
    onConfirm && onConfirm(bill.id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <SafeAreaView edges={["top"]} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Bill</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>
                  Loading payment information...
                </Text>
              </View>
            ) : infoLandlord ? (
              <>
                <Text style={styles.modalSectionTitle}>
                  Landlord Payment Information
                </Text>
                <View style={styles.paymentInfoCard}>
                  <View style={styles.paymentInfoRow}>
                    <Text style={styles.paymentLabel}>Bank Name:</Text>
                    <Text style={styles.paymentValue}>
                      {infoLandlord.bankName}
                    </Text>
                  </View>
                  <View style={styles.paymentInfoRow}>
                    <Text style={styles.paymentLabel}>Bank Number:</Text>
                    <Text style={styles.paymentValue}>
                      {infoLandlord.bankNumber}
                    </Text>
                  </View>
                  <View style={styles.paymentInfoRow}>
                    <Text style={styles.paymentLabel}>Total Amount:</Text>
                    <Text style={styles.paymentPrice}>
                      {totalAmount?.toLocaleString("vi-VN")} ₫
                    </Text>
                  </View>
                  <View style={styles.paymentInfoRow}>
                    <Text style={styles.paymentLabel}>
                      Account Holder Name:
                    </Text>
                    <Text style={styles.paymentValue}>
                      {infoLandlord.accountHolderName}
                    </Text>
                  </View>
                  {/* <View style={styles.paymentInfoRow}>
                    <Text style={styles.paymentLabel}>Email:</Text>
                    <Text style={styles.paymentValue}>{paymentInfo.email}</Text>
                  </View> */}
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                  <Image
                    source={{
                      uri: `https://img.vietqr.io/image/${infoLandlord.binCode}-${infoLandlord.bankNumber}-qr_only.png?amount=${totalAmount}&addInfo=Dat thanh toan bill thue phong thang ${bill?.month}`,
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrText}>
                    Scan QR code to pay for {bill?.month}
                  </Text>
                </View>

                <Text style={styles.modalSectionTitle}>
                  Upload Payment Proof
                  <Text style={{ color: "#F44336" }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handlePickImage()}
                  disabled={imageUploading}
                >
                  {imageUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={20} color="#fff" />
                      <Text style={styles.uploadButtonText}>
                        {uploadedImageUri
                          ? "Change Image"
                          : "Upload Transfer Bill"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {uploadedImageUri && (
                  <View style={styles.uploadedImageContainer}>
                    <Image
                      source={{ uri: uploadedImageUri }}
                      style={styles.uploadedImage}
                    />
                  </View>
                )}
                <View style={styles.confirmationContainer}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setTransferConfirmed(!transferConfirmed)}
                  >
                    <Ionicons
                      name={transferConfirmed ? "checkbox" : "square-outline"}
                      size={24}
                      color="#4A90E2"
                    />
                    <Text style={styles.checkboxLabel}>
                      I confirm that I have completed the transfer
                    </Text>
                  </TouchableOpacity>
                </View>

                {!transferConfirmed && (
                  <View style={styles.reminderContainer}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#FF9800"
                    />
                    <Text style={styles.reminderText}>
                      Please confirm that you have completed the transfer
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    // (!transferConfirmed || !imageUploadedSuccessfully) &&
                    (!transferConfirmed || isSendingOTP) &&
                      styles.submitButtonDisabled,
                  ]}
                  onPress={() => handleConfirmPayment()}
                  //   disabled={!transferConfirmed || !imageUploadedSuccessfully}
                  disabled={!transferConfirmed || isSendingOTP}
                >
                  {isSendingOTP ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.submitButtonText}>
                        Sending OTP...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>Confirm Payment</Text>
                  )}
                </TouchableOpacity>
                <View style={{ height: spacing.xl }} />
              </>
            ) : null}
          </ScrollView>
          <SafeAreaView edges={["bottom"]} />
        </View>
      </View>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        visible={showOTPModal}
        email={loggedInUser?.userProfile?.email || ""}
        generatedOTP={generatedOTP}
        onClose={() => setShowOTPModal(false)}
        onVerifySuccess={handleOTPVerifySuccess}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    maxHeight: "95%",
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
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["4xl"],
  },
  loadingText: {
    fontSize: fontSize.md,
    color: "#666",
    marginTop: spacing.md,
  },
  modalSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#333",
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  paymentInfoCard: {
    backgroundColor: "#f8f9ff",
    padding: spacing.xl,
    borderRadius: normalize(12),
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  paymentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  paymentLabel: {
    fontSize: fontSize.md,
    color: "#666",
    fontWeight: "600",
  },
  paymentValue: {
    fontSize: fontSize.md,
    color: "#333",
    fontWeight: "500",
  },
  paymentPrice: {
    fontSize: fontSize.md,
    color: "#4CAF50",
    fontWeight: "700",
  },
  qrContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: normalize(12),
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  qrImage: {
    width: normalize(200),
    height: normalize(200),
  },
  qrText: {
    fontSize: fontSize.sm,
    color: "#666",
    marginTop: spacing.md,
    textAlign: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    padding: spacing.lg,
    borderRadius: normalize(8),
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  uploadButtonText: {
    fontSize: fontSize.md,
    color: "#fff",
    fontWeight: "600",
  },
  uploadedImageContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
    borderRadius: normalize(8),
    overflow: "hidden",
  },
  uploadedImage: {
    width: "100%",
    height: normalize(200),
    borderRadius: normalize(8),
  },
  confirmationContainer: {
    marginVertical: spacing.lg,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  checkboxLabel: {
    fontSize: fontSize.md,
    color: "#333",
    flex: 1,
  },
  reminderContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    padding: spacing.md,
    borderRadius: normalize(8),
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  reminderText: {
    fontSize: fontSize.sm,
    color: "#FF9800",
    flex: 1,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#4A90E2",
    padding: spacing.xl,
    borderRadius: normalize(12),
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    color: "#fff",
    fontWeight: "700",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});

export default PaymentBill;
