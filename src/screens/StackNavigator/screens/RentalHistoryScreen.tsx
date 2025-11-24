import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  fontSize,
  layout,
  normalize,
  spacing,
} from "../../../utils/responsive";
import useAuthStore from "../../../Stores/useAuthStore";
import Toast from "react-native-toast-message";
import {
  userFetchBookings,
  getLandlordPaymentInfo,
  uploadBillTransferImage,
  updateBookingStatus,
} from "../../../Services/BookingService";
import { createRequest } from "../../../Services/RequirementService";
import { URL_IMAGE } from "../../../Services/Constants";
import * as ImagePicker from "expo-image-picker";

type Props = {
  navigation: any;
};

interface BookingData {
  bookingId: string;
  roomName: string;
  roomId: string;
  address: string;
  rentalDate: string;
  rentalExpires: string;
  tenantCount: number;
  monthlyRent: number;
  status: number;
  isRemoved: number;
  landlordName: string;
  landlordPhone: string;
  imageProof?: string;
}

interface LandlordPaymentInfo {
  bankNumber: string;
  binCode: string;
  depositAmount: number;
  phoneNumber: string;
  email: string;
}

const RentalHistoryScreen = ({ navigation }: Props) => {
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(
    null
  );
  const [paymentInfo, setPaymentInfo] = useState<LandlordPaymentInfo | null>(
    null
  );
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Image Preview Modal
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string>("");

  // Request Modal State
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedRoomForRequest, setSelectedRoomForRequest] =
    useState<BookingData | null>(null);
  const [requestDescription, setRequestDescription] = useState("");
  const [requestImageUri, setRequestImageUri] = useState<string | null>(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      loadBookings();
    }
  }, [currentUser?.id]);

  const loadBookings = async (page = 1) => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const response: any = await userFetchBookings(
        currentUser.id,
        page - 1,
        pagination.pageSize
      );

      const bookingsData = response.bookings || response.content || [];
      const total = response.totalRecords || response.totalElements || 0;

      const mappedBookings: BookingData[] = bookingsData.map((booking: any) => {
        const address = booking.room?.address;
        const fullAddress = address
          ? `${address.street}, ${address.ward?.name}, ${address.ward?.district?.name}, ${address.ward?.district?.province?.name}`
          : "N/A";

        return {
          bookingId: booking.bookingId,
          roomName: booking.room?.title || "N/A",
          roomId: booking.room?.roomId || "",
          address: fullAddress,
          rentalDate: booking.rentalDate || "",
          rentalExpires: booking.rentalExpires || "",
          tenantCount: booking.tenantCount || 0,
          monthlyRent: booking.room?.priceMonth || 0,
          status: booking.status || 0,
          isRemoved: booking.isRemoved || 0,
          landlordName: booking.room?.ownerName || "N/A",
          landlordPhone: booking.room?.ownerPhone || "N/A",
          imageProof: booking.imageProof || "",
        };
      });

      setBookings(mappedBookings);
      setPagination({ current: page, pageSize: pagination.pageSize, total });
    } catch (error) {
      console.error("Error loading bookings:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load rental history",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = async (booking: BookingData) => {
    setSelectedBooking(booking);
    setPaymentModalVisible(true);
    setTransferConfirmed(false);
    setUploadedImageUri(null);

    // Fetch payment info
    try {
      const info: any = await getLandlordPaymentInfo(booking.bookingId);
      setPaymentInfo(info);
    } catch (error) {
      console.error("Failed to fetch payment info:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load payment information",
      });
    }
  };

  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedBooking(null);
    setPaymentInfo(null);
    setTransferConfirmed(false);
    setUploadedImageUri(null);
  };

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
        if (!selectedBooking) return;
        await uploadBillTransferImage(selectedBooking.bookingId, uri);
        setUploadedImageUri(uri);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Bill transfer image uploaded successfully!",
        });
      } catch (error) {
        console.error("Failed to upload image:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to upload image",
        });
      } finally {
        setImageUploading(false);
      }
    }
  };

  const handleConfirmPayment = async () => {
    if (!transferConfirmed) {
      Alert.alert(
        "Confirmation Required",
        "Please confirm that you have completed the transfer"
      );
      return;
    }

    if (!selectedBooking) return;

    try {
      await updateBookingStatus(selectedBooking.bookingId, { status: "3" });
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Payment confirmation submitted successfully!",
      });
      handleClosePaymentModal();
      loadBookings(pagination.current);
    } catch (error) {
      console.error("Failed to confirm payment:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to confirm payment",
      });
    }
  };

  const handleImagePreview = (imageUri: string) => {
    setPreviewImageUri(imageUri);
    setImagePreviewVisible(true);
  };

  // Request Modal Handlers
  const handleOpenRequestModal = (booking: BookingData) => {
    setSelectedRoomForRequest(booking);
    setRequestModalVisible(true);
    setRequestDescription("");
    setRequestImageUri(null);
  };

  const handleCloseRequestModal = () => {
    setRequestModalVisible(false);
    setSelectedRoomForRequest(null);
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
      Alert.alert("Validation Error", "Please enter request description");
      return;
    }

    if (requestDescription.trim().length < 5) {
      Alert.alert(
        "Validation Error",
        "Description must be at least 5 characters long"
      );
      return;
    }

    if (!selectedRoomForRequest || !currentUser?.id) return;

    setRequestSubmitting(true);
    try {
      await createRequest(
        {
          userId: currentUser.id,
          roomId: selectedRoomForRequest.roomId,
          description: requestDescription.trim(),
        },
        requestImageUri || undefined
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Request created successfully!",
      });
      handleCloseRequestModal();
    } catch (error) {
      console.error("Error creating request:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create request. Please try again.",
      });
    } finally {
      setRequestSubmitting(false);
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "#FF9800"; // Orange - Pending
      case 1:
        return "#2196F3"; // Blue - Accepted (need to pay deposit)
      case 2:
        return "#F44336"; // Red - Rejected
      case 3:
        return "#FFC107"; // Amber - Waiting for deposit confirmation
      case 4:
        return "#4CAF50"; // Green - Deposited/Renting
      default:
        return "#999";
    }
  };

  const getStatusText = (
    status: number,
    rentalDate?: string,
    rentalExpires?: string
  ) => {
    switch (status) {
      case 0:
        return "Pending";
      case 1:
        return "Accepted";
      case 2:
        return "Rejected";
      case 3:
        return "Waiting Confirmation";
      case 4: {
        if (!rentalDate || !rentalExpires) return "Deposited";
        const today = new Date();
        const startDate = new Date(rentalDate);
        const endDate = new Date(rentalExpires);

        if (today < startDate) {
          return "Upcoming";
        } else if (today > endDate) {
          return "Expired";
        } else {
          return "Renting";
        }
      }
      default:
        return "Unknown";
    }
  };

  const getStatusColorForItem = (item: BookingData) => {
    // For status 4, check if expired to return orange color
    if (item.status === 4 && item.rentalExpires) {
      if (new Date() > new Date(item.rentalExpires)) {
        return "#FF9800"; // Orange for expired
      }
    }
    return getStatusColor(item.status);
  };

  const renderBookingItem = (item: BookingData) => {
    const statusText = getStatusText(
      item.status,
      item.rentalDate,
      item.rentalExpires
    );
    const statusColor = getStatusColorForItem(item);

    return (
      <TouchableOpacity
        key={item.bookingId}
        style={styles.historyCard}
        onPress={() =>
          navigation.navigate("RentalRoomView", {
            booking: item,
            onRefresh: () => loadBookings(pagination.current),
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.historyHeader}>
          <View style={styles.historyTitleContainer}>
            <Ionicons name="home" size={20} color="#4A90E2" />
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle} numberOfLines={1}>
                {item.roomName}
              </Text>
              <Text style={styles.requestType}>{item.landlordName}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.historyDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.detailText} numberOfLines={2}>
              {item.address}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.detailText}>
              {item.rentalDate
                ? new Date(item.rentalDate).toLocaleDateString()
                : "N/A"}
              -
              {item.rentalExpires
                ? new Date(item.rentalExpires).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={14} color="#4CAF50" />
            <Text style={[styles.detailText, styles.priceText]}>
              {item.monthlyRent.toLocaleString("vi-VN")} ₫/month
            </Text>
          </View>
        </View>

        {item.isRemoved === 1 && (
          <View style={styles.removedBadge}>
            <Ionicons name="warning" size={16} color="#F44336" />
            <Text style={styles.removedText}>Room Unavailable</Text>
          </View>
        )}

        <View style={styles.viewDetailsContainer}>
          <Text style={styles.viewDetailsText}>Tap to view details</Text>
          <Ionicons name="chevron-forward" size={16} color="#4A90E2" />
        </View>
      </TouchableOpacity>
    );
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
        <Text style={styles.headerTitle}>Rental History</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.emptyText}>Loading bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              Your rental bookings will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {bookings.map(renderBookingItem)}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClosePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="card" size={24} color="#4A90E2" />
                <Text style={styles.modalTitle}>Payment Information</Text>
              </View>
              <TouchableOpacity onPress={handleClosePaymentModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {paymentInfo ? (
                <>
                  {/* Bank Info */}
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>Transfer Details</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Account Number:</Text>
                      <Text style={styles.infoValue}>
                        {paymentInfo.bankNumber}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Amount:</Text>
                      <Text style={styles.infoValue}>
                        {paymentInfo.depositAmount.toLocaleString("vi-VN")} ₫
                      </Text>
                    </View>
                  </View>

                  {/* QR Code */}
                  <View style={styles.qrContainer}>
                    <Image
                      source={{
                        uri: `https://img.vietqr.io/image/${paymentInfo.binCode}-${paymentInfo.bankNumber}-qr_only.png?amount=${paymentInfo.depositAmount}&addInfo=Dat coc phong ${selectedBooking?.bookingId}`,
                      }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.qrText}>
                      Scan QR code to pay deposit
                    </Text>
                  </View>

                  {/* Contact Info */}
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>Contact Landlord</Text>
                    <View style={styles.infoRow}>
                      <Ionicons name="call" size={16} color="#666" />
                      <Text style={styles.infoValue}>
                        {paymentInfo.phoneNumber}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="mail" size={16} color="#666" />
                      <Text style={styles.infoValue}>{paymentInfo.email}</Text>
                    </View>
                  </View>

                  {/* Upload Image */}
                  <View style={styles.uploadSection}>
                    <Text style={styles.uploadTitle}>
                      Upload Bill Transfer Image
                    </Text>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={handlePickImage}
                      disabled={imageUploading}
                    >
                      <Ionicons name="cloud-upload" size={20} color="#4A90E2" />
                      <Text style={styles.uploadButtonText}>
                        {imageUploading
                          ? "Uploading..."
                          : uploadedImageUri
                          ? "Change Image"
                          : "Select Image"}
                      </Text>
                    </TouchableOpacity>
                    {uploadedImageUri && (
                      <Image
                        source={{ uri: uploadedImageUri }}
                        style={styles.uploadedImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>

                  {/* Confirmation Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setTransferConfirmed(!transferConfirmed)}
                  >
                    <Ionicons
                      name={transferConfirmed ? "checkbox" : "square-outline"}
                      size={24}
                      color={transferConfirmed ? "#4A90E2" : "#999"}
                    />
                    <Text style={styles.checkboxText}>
                      I confirm that I have completed the bank transfer
                    </Text>
                  </TouchableOpacity>

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleClosePaymentModal}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        !transferConfirmed && styles.confirmButtonDisabled,
                      ]}
                      onPress={handleConfirmPayment}
                      disabled={!transferConfirmed}
                    >
                      <Text style={styles.confirmButtonText}>
                        Confirm Payment
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color="#4A90E2" />
                  <Text style={styles.emptyText}>
                    Loading payment information...
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={imagePreviewVisible}
        transparent={true}
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewClose}
            onPress={() => setImagePreviewVisible(false)}
          >
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: previewImageUri }}
            style={styles.imagePreviewImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Request Modal */}
      <Modal
        visible={requestModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseRequestModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="document-text" size={24} color="#4A90E2" />
                <Text style={styles.modalTitle}>New Request</Text>
              </View>
              <TouchableOpacity onPress={handleCloseRequestModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Room Info */}
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Room:</Text>
                <Text style={styles.infoValue}>
                  {selectedRoomForRequest?.roomName}
                </Text>
              </View>

              {/* Description Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Request Description
                  <Text style={{ color: "#F44336" }}>*</Text>
                </Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g., Yêu cầu sửa chữa điện nước"
                  placeholderTextColor="#999"
                  value={requestDescription}
                  onChangeText={setRequestDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>
                  {requestDescription.length}/500
                </Text>
              </View>

              {/* Image Upload */}
              <View style={styles.uploadSection}>
                <Text style={styles.uploadTitle}>Upload Image (Optional)</Text>
                <Text style={styles.uploadSubtitle}>
                  Upload an image to help describe your request (Max: 10MB)
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickRequestImage}
                >
                  <Ionicons name="cloud-upload" size={20} color="#4A90E2" />
                  <Text style={styles.uploadButtonText}>
                    {requestImageUri ? "Change Image" : "Select Image"}
                  </Text>
                </TouchableOpacity>
                {requestImageUri && (
                  <Image
                    source={{ uri: requestImageUri }}
                    style={styles.uploadedImage}
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCloseRequestModal}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    requestSubmitting && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleSubmitRequest}
                  disabled={requestSubmitting}
                >
                  {requestSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
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
  },
  historyList: {
    padding: layout.screenPadding,
  },
  historyCard: {
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
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  historyTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  historyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  requestType: {
    fontSize: fontSize.sm,
    color: "#999",
    marginTop: 2,
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
  historyDetails: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.md,
    color: "#666",
    flex: 1,
  },
  priceText: {
    color: "#4CAF50",
    fontWeight: "700",
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 2,
  },
  historyFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: spacing.md,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: "#4A90E2",
    borderRadius: normalize(12),
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  payButtonText: {
    fontSize: fontSize.md,
    color: "#fff",
    fontWeight: "700",
  },
  requestButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: "#E8F2FF",
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderColor: "#4A90E2",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  requestButtonText: {
    fontSize: fontSize.md,
    color: "#4A90E2",
    fontWeight: "700",
  },
  removedBadge: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: "#FFEBEE",
    borderRadius: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  removedText: {
    fontSize: fontSize.md,
    color: "#F44336",
    fontWeight: "700",
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: spacing.sm,
  },
  viewDetailsText: {
    fontSize: fontSize.md,
    color: "#4A90E2",
    fontWeight: "700",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#E8F2FF",
    borderRadius: normalize(8),
  },
  rateButton: {
    backgroundColor: "#FFF8E1",
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    color: "#4A90E2",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["4xl"] * 2,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: "#999",
    marginTop: spacing.lg,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: "#ccc",
    marginTop: spacing.xs,
  },
  // Modal Styles
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
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: "#333",
  },
  modalBody: {
    padding: layout.screenPadding,
  },
  infoCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: normalize(12),
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  infoCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#333",
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },
  qrContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: normalize(12),
    padding: spacing.lg,
    marginBottom: spacing.md,
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
  uploadSection: {
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: "#333",
    marginBottom: spacing.sm,
  },
  uploadSubtitle: {
    fontSize: fontSize.sm,
    color: "#666",
    marginBottom: spacing.md,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: "#E8F2FF",
    borderRadius: normalize(8),
    borderWidth: 1,
    borderColor: "#4A90E2",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    fontSize: fontSize.sm,
    color: "#4A90E2",
    fontWeight: "600",
  },
  uploadedImage: {
    width: "100%",
    height: normalize(150),
    borderRadius: normalize(8),
    marginTop: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: "#333",
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: "#F3F4F6",
    borderRadius: normalize(8),
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: "#333",
    minHeight: normalize(100),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  charCount: {
    fontSize: fontSize.xs,
    color: "#999",
    textAlign: "right",
    marginTop: spacing.xs,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: "#FFF8E1",
    borderRadius: normalize(8),
  },
  checkboxText: {
    fontSize: fontSize.sm,
    color: "#333",
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: "#f0f0f0",
    borderRadius: normalize(8),
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    color: "#666",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: "#4A90E2",
    borderRadius: normalize(8),
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#ccc",
  },
  confirmButtonText: {
    fontSize: fontSize.md,
    color: "#fff",
    fontWeight: "600",
  },
  // Image Preview Modal
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
  imagePreviewImage: {
    width: "90%",
    height: "70%",
  },
});

export default RentalHistoryScreen;
