import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fontSize, layout, normalize, spacing } from "../utils/responsive";
import Toast from "react-native-toast-message";
import { createRequest } from "../Services/RequirementService";
import { updateBookingStatus } from "../Services/BookingService";
import * as ImagePicker from "expo-image-picker";
import useAuthStore from "../Stores/useAuthStore";
import { URL_IMAGE } from "../Services/Constants";
import { PaymentModal } from "./index";
import { CommonActions } from "@react-navigation/native";
import { BookingData } from "../types/types";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  navigation: any;
  route: {
    params: {
      booking: BookingData;
    };
  };
}

const RentalRoomView = ({ navigation, route }: Props) => {
  const { booking: initialBooking } = route.params;
  const [booking, setBooking] = useState<BookingData>(initialBooking);

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // Image Preview Modal
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string>("");

  // Request Modal State
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestDescription, setRequestDescription] = useState("");
  const [requestImageUri, setRequestImageUri] = useState<string | null>(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const getStatusText = (
    status: number,
    rentalDate?: string,
    rentalExpires?: string
  ): string => {
    if (status === 0) return "Pending";
    if (status === 1) return "Accepted";
    if (status === 2) return "Rejected";
    if (status === 3) return "Waiting Confirmation";
    if (status === 4) {
      if (rentalExpires && new Date() > new Date(rentalExpires)) {
        return "Expired";
      }
      if (rentalDate && new Date() < new Date(rentalDate)) {
        return "Upcoming";
      }
      return "Renting";
    }
    return "Unknown";
  };

  const getStatusColor = (status: number): string => {
    if (status === 0) return "#FF9800"; // Orange - Pending
    if (status === 1) return "#2196F3"; // Blue - Accepted
    if (status === 2) return "#F44336"; // Red - Rejected
    if (status === 3) return "#FFC107"; // Amber - Waiting Confirmation
    if (status === 4) {
      // For status 4, check if expired
      if (
        booking.rentalExpires &&
        new Date() > new Date(booking.rentalExpires)
      ) {
        return "#FF9800"; // Orange - Expired
      }
      return "#4CAF50"; // Green - Renting/Deposited
    }
    return "#666";
  };

  const canPayDeposit = booking.status === 1;
  const canRequest =
    booking.status === 4 &&
    booking.rentalExpires &&
    new Date() <= new Date(booking.rentalExpires);

  // Payment Modal Functions
  const handleOpenPaymentModal = () => {
    setPaymentModalVisible(true);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
  };

  const handlePaymentSuccess = async (bookingId: string) => {
    try {
      console.log("Confirming payment for booking:", bookingId);
      // Update with newStatus = 3 (Waiting Confirmation)
      const statusUpdate = {
        newStatus: 3, // Backend expects newStatus as number
      };
      console.log("Status update payload:", statusUpdate);

      await updateBookingStatus(bookingId, statusUpdate);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Payment confirmation submitted successfully!",
      });

      // Navigate back and trigger refresh via navigation state
      navigation.dispatch(
        CommonActions.navigate({
          name: "RentalHistoryScreen",
          params: { refresh: Date.now() },
        })
      );
    } catch (error) {
      // Error is already handled and shown in PaymentModal
      throw error;
    }
  };

  // Image Preview Functions
  const handleImagePreview = (uri: string) => {
    setPreviewImageUri(uri);
    setImagePreviewVisible(true);
  };

  // Request Modal Functions
  const handleOpenRequestModal = () => {
    setRequestModalVisible(true);
    setRequestDescription("");
    setRequestImageUri(null);
  };

  const handleCloseRequestModal = () => {
    setRequestModalVisible(false);
    setRequestDescription("");
    setRequestImageUri(null);
  };

  const handlePickRequestImage = async () => {
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
      setRequestImageUri(result.assets[0].uri);
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestDescription.trim()) {
      Alert.alert("Error", "Please enter a request description");
      return;
    }

    const currentUser = useAuthStore.getState().loggedInUser;
    if (!currentUser?.id) {
      Alert.alert("Error", "User not found");
      return;
    }

    setRequestSubmitting(true);
    try {
      const requestData = {
        userId: currentUser.id,
        roomId: booking.roomId,
        description: requestDescription.trim(),
      };

      await createRequest(requestData, requestImageUri || undefined);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Request submitted successfully!",
      });

      handleCloseRequestModal();
    } catch (error) {
      console.error("Failed to submit request:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to submit request",
      });
    } finally {
      setRequestSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Room Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={24} color="#4A90E2" />
            <Text style={styles.cardTitle}>{booking.roomName}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(booking.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(booking.status) },
              ]}
            >
              {getStatusText(
                booking.status,
                booking.rentalDate,
                booking.rentalExpires
              )}
            </Text>
          </View>
        </View>

        {/* Landlord Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Landlord Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={18} color="#4A90E2" />
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{booking.landlordName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={18} color="#4A90E2" />
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{booking.landlordPhone}</Text>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color="#4A90E2" />
            <Text style={styles.infoValue}>{booking.address}</Text>
          </View>
        </View>

        {/* Rental Period Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rental Period</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={18} color="#4A90E2" />
            <Text style={styles.infoLabel}>Start:</Text>
            <Text style={styles.infoValue}>
              {booking.rentalDate
                ? new Date(booking.rentalDate).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#4A90E2" />
            <Text style={styles.infoLabel}>End:</Text>
            <Text style={styles.infoValue}>
              {booking.rentalExpires
                ? new Date(booking.rentalExpires).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
        </View>

        {/* Financial Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Financial Details</Text>
          <View style={styles.infoRow}>
            <Ionicons name="cash" size={18} color="#4A90E2" />
            <Text style={styles.infoLabel}>Monthly Rent:</Text>
            <Text style={styles.priceValue}>
              {booking.monthlyRent.toLocaleString("vi-VN")} ₫
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people" size={18} color="#4A90E2" />
            <Text style={styles.infoLabel}>Tenants:</Text>
            <Text style={styles.infoValue}>{booking.tenantCount}</Text>
          </View>
        </View>

        {/* Payment Proof */}
        {booking.imageProof && booking.status === 3 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Proof</Text>
            <TouchableOpacity
              style={styles.imagePreviewButton}
              onPress={() =>
                handleImagePreview(`${URL_IMAGE}${booking.imageProof}`)
              }
            >
              <Image
                source={{ uri: `${URL_IMAGE}${booking.imageProof}` }}
                style={styles.proofThumbnail}
                resizeMode="cover"
              />
              <View style={styles.imagePreviewTextContainer}>
                <Ionicons name="eye" size={20} color="#4A90E2" />
                <Text style={styles.imagePreviewText}>View Full Image</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Unavailable Notice */}
        {booking.isRemoved === 1 && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={22} color="#F44336" />
            <Text style={styles.warningText}>
              This room is no longer available
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {booking.isRemoved === 0 && (canPayDeposit || canRequest) && (
          <View style={styles.actionContainer}>
            {canPayDeposit && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleOpenPaymentModal}
              >
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Confirm Deposit</Text>
              </TouchableOpacity>
            )}
            {canRequest && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleOpenRequestModal}
              >
                <Ionicons name="add-circle" size={20} color="#4A90E2" />
                <Text style={styles.secondaryButtonText}>New Request</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        bookingId={booking.bookingId}
        onClose={handleClosePaymentModal}
        onConfirm={handlePaymentSuccess}
      />

      {/* Request Modal */}
      <Modal
        visible={requestModalVisible}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Request</Text>
                <TouchableOpacity onPress={handleCloseRequestModal}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalSectionTitle}>
                  Describe your request
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your request description..."
                  multiline
                  numberOfLines={4}
                  value={requestDescription}
                  onChangeText={setRequestDescription}
                />

                <Text style={styles.modalSectionTitle}>
                  Attach Image (Optional)
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickRequestImage}
                >
                  <Ionicons name="image" size={20} color="#fff" />
                  <Text style={styles.uploadButtonText}>
                    {requestImageUri ? "Change Image" : "Pick Image"}
                  </Text>
                </TouchableOpacity>

                {requestImageUri && (
                  <View style={styles.uploadedImageContainer}>
                    <Image
                      source={{ uri: requestImageUri }}
                      style={styles.uploadedImage}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    requestSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitRequest}
                  disabled={requestSubmitting}
                >
                  {requestSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={imagePreviewVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewClose}
            onPress={() => setImagePreviewVisible(false)}
          >
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: previewImageUri }}
            style={styles.imagePreviewFull}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: "#333",
  },
  headerRight: {
    width: normalize(40),
  },
  content: {
    flex: 1,
    padding: layout.screenPadding,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: normalize(12),
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: normalize(4),
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: normalize(12),
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#333",
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: "#666",
    fontWeight: "600",
    minWidth: 80,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: "#333",
    flex: 1,
    fontWeight: "500",
  },
  priceValue: {
    fontSize: fontSize.lg,
    color: "#4CAF50",
    fontWeight: "700",
    flex: 1,
  },
  imagePreviewButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: "#f8f9ff",
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  proofThumbnail: {
    width: 90,
    height: 90,
    borderRadius: normalize(8),
    marginRight: spacing.lg,
    backgroundColor: "#f0f0f0",
  },
  imagePreviewTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  imagePreviewText: {
    fontSize: fontSize.md,
    color: "#4A90E2",
    fontWeight: "600",
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: spacing.lg,
    borderRadius: normalize(10),
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    gap: spacing.md,
  },
  warningText: {
    fontSize: fontSize.md,
    color: "#F44336",
    fontWeight: "600",
    flex: 1,
  },
  actionContainer: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    padding: spacing.xl,
    borderRadius: normalize(12),
    elevation: 3,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: spacing.xl,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: "#4A90E2",
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: fontSize.lg,
    color: "#4A90E2",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    maxHeight: "90%",
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
  modalSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#333",
    marginBottom: spacing.md,
    marginTop: spacing.sm,
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
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: normalize(8),
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: "#333",
    minHeight: normalize(120),
    textAlignVertical: "top",
    marginBottom: spacing.lg,
    backgroundColor: "#f8f9ff",
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewClose: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  imagePreviewFull: {
    width: "100%",
    height: "100%",
  },
});

export default RentalRoomView;
