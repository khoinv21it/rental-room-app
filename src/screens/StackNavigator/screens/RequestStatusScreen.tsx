import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  fontSize,
  layout,
  normalize,
  spacing,
} from "../../../utils/responsive";
import useAuthStore from "../../../Stores/useAuthStore";
import Toast from "react-native-toast-message";
import {
  RequirementDetail,
  getRequestsByUser,
  getStatusColor,
  getStatusText,
  updateRequirement,
  updateRequirementWithImage,
} from "../../../Services/RequirementService";
import { URL_IMAGE } from "../../../Services/Constants";

type Props = {
  navigation: any;
};

const RequestStatusScreen = ({ navigation }: Props) => {
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const [requests, setRequests] = useState<RequirementDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // Update modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<RequirementDetail | null>(null);
  const [updateDescription, setUpdateDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      loadRequests();
    }
  }, [currentPage, currentUser?.id]);

  const loadRequests = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      console.log("Loading requests, page:", currentPage);

      const result = await getRequestsByUser(
        currentUser.id,
        currentPage,
        pageSize
      );

      console.log("Loaded requests:", {
        currentPage,
        totalRecords: result.totalRecords,
        totalPages: result.totalPages,
        dataLength: result.data.length,
      });

      setRequests(result.data);
      setTotalPages(result.totalPages);
      setTotalRecords(result.totalRecords);
    } catch (error: any) {
      console.error("Error loading requests:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load requests",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleUpdateRequest = async (request: RequirementDetail) => {
    if (request.status !== 0) {
      Toast.show({
        type: "info",
        text1: "Cannot Edit",
        text2: "Only 'Not Processed' requests can be edited",
      });
      return;
    }

    setSelectedRequest(request);
    setUpdateDescription(request.description);
    setSelectedImage(request.imageUrl || null);
    setShowUpdateModal(true);
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Toast.show({
          type: "error",
          text1: "Permission Required",
          text2: "Please allow access to your photo library",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to pick image",
      });
    }
  };

  const handleSubmitUpdate = async () => {
    if (!selectedRequest) return;

    if (!updateDescription.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter a description",
      });
      return;
    }

    setUpdating(true);
    try {
      console.log("Starting update for request:", selectedRequest.id);
      console.log("Description:", updateDescription.trim());
      console.log("Image URI:", selectedImage);

      // Check if user selected a new image
      const hasNewImage =
        selectedImage && selectedImage !== selectedRequest.imageUrl;

      if (hasNewImage) {
        // Update with image
        console.log("Calling updateRequirementWithImage...");
        await updateRequirementWithImage(
          selectedRequest.id,
          updateDescription.trim(),
          selectedImage!
        );
      } else {
        // Update description only
        console.log("Calling updateRequirement (description only)...");
        await updateRequirement(selectedRequest.id, {
          id: selectedRequest.id,
          description: updateDescription.trim(),
        });
      }

      console.log("Update successful!");

      // Reload the entire list to get fresh data from server
      await loadRequests();

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Request updated successfully",
      });

      // Close modal
      setShowUpdateModal(false);
      setSelectedRequest(null);
      setUpdateDescription("");
      setSelectedImage(null);
    } catch (error: any) {
      console.error("Error updating request:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2:
          error.response?.data?.message ||
          error.message ||
          "Failed to update request",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseModal = () => {
    setShowUpdateModal(false);
    setSelectedRequest(null);
    setUpdateDescription("");
    setSelectedImage(null);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleGoToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const renderRequest = (request: RequirementDetail) => (
    <TouchableOpacity
      key={request.id}
      style={styles.requestCard}
      onPress={() => handleUpdateRequest(request)}
      activeOpacity={0.7}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestTitleContainer}>
          <Ionicons name="document-text" size={24} color="#4A90E2" />
          <View style={{ flex: 1 }}>
            <Text style={styles.requestTitle}>
              {request.roomTitle || "Room Request"}
            </Text>
            <Text style={styles.requestType}>
              {request.userName} • {request.email}
            </Text>
          </View>
        </View>
        {request.imageUrl && (
          <Ionicons name="image" size={20} color="#4A90E2" />
        )}
      </View>

      {/* Request Image Preview */}
      {request.imageUrl && (
        <View style={styles.requestImageContainer}>
          <Image
            source={{ uri: `${URL_IMAGE}${request.imageUrl}` }}
            style={styles.requestImage}
            resizeMode="cover"
          />
        </View>
      )}

      <Text style={styles.requestDescription} numberOfLines={2}>
        {request.description}
      </Text>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={18} color="#666" />
          <Text style={styles.detailText}>
            Created:
            {new Date(request.createdDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>

      <View style={styles.requestFooter}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(request.status) + "20" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(request.status) },
            ]}
          >
            {getStatusText(request.status)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.updateButton,
            request.status !== 0 && styles.updateButtonDisabled,
          ]}
          onPress={() => handleUpdateRequest(request)}
          disabled={request.status !== 0}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={request.status !== 0 ? "#999" : "#4A90E2"}
          />
          <Text
            style={[
              styles.updateButtonText,
              request.status !== 0 && styles.updateButtonTextDisabled,
            ]}
          >
            Update
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4A90E2"]}
            tintColor="#4A90E2"
          />
        }
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.emptyText}>Loading requests...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No requests found</Text>
            <Text style={styles.emptySubtext}>
              Submit a request to get started
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.requestsList}>
              {requests.map(renderRequest)}
            </View>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <View style={styles.paginationInfo}>
                  <Text style={styles.paginationText}>
                    Page {currentPage + 1} of {totalPages}
                  </Text>
                  <Text style={styles.paginationSubtext}>
                    {totalRecords} total
                    {totalRecords === 1 ? "request" : "requests"}
                  </Text>
                </View>

                <View style={styles.paginationButtons}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      currentPage === 0 && styles.paginationButtonDisabled,
                    ]}
                    onPress={handlePreviousPage}
                    disabled={currentPage === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={currentPage === 0 ? "#ccc" : "#4A90E2"}
                    />
                    <Text
                      style={[
                        styles.paginationButtonText,
                        currentPage === 0 &&
                          styles.paginationButtonTextDisabled,
                      ]}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      currentPage >= totalPages - 1 &&
                        styles.paginationButtonDisabled,
                    ]}
                    onPress={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <Text
                      style={[
                        styles.paginationButtonText,
                        currentPage >= totalPages - 1 &&
                          styles.paginationButtonTextDisabled,
                      ]}
                    >
                      Next
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={currentPage >= totalPages - 1 ? "#ccc" : "#4A90E2"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Update Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Request</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Room Title */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Room</Text>
                <Text style={styles.modalReadOnlyText}>
                  {selectedRequest?.roomTitle || "N/A"}
                </Text>
              </View>

              {/* Description Input */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Description *</Text>
                <TextInput
                  style={styles.modalTextArea}
                  placeholder="Enter request description..."
                  placeholderTextColor="#999"
                  value={updateDescription}
                  onChangeText={setUpdateDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Image Picker */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Image (Optional)</Text>

                {/* Current Image Display */}
                {selectedRequest?.imageUrl &&
                  !selectedImage?.startsWith("file://") && (
                    <View style={styles.currentImageContainer}>
                      <Text style={styles.currentImageLabel}>
                        Current image:
                      </Text>
                      <Image
                        source={{
                          uri: `${URL_IMAGE}${selectedRequest.imageUrl}`,
                        }}
                        style={styles.currentImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={handlePickImage}
                >
                  <Ionicons name="image-outline" size={28} color="#4A90E2" />
                  <Text style={styles.imagePickerText}>
                    {selectedImage?.startsWith("file://")
                      ? "Change Image"
                      : "Select New Image"}
                  </Text>
                </TouchableOpacity>

                {/* New Selected Image Preview */}
                {selectedImage?.startsWith("file://") && (
                  <View style={styles.imagePreviewContainer}>
                    <Text style={styles.newImageLabel}>
                      New image selected:
                    </Text>
                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() =>
                        setSelectedImage(selectedRequest?.imageUrl || null)
                      }
                    >
                      <Ionicons name="close-circle" size={28} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Current Status */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        getStatusColor(selectedRequest?.status || 0) + "20",
                      alignSelf: "flex-start",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(selectedRequest?.status || 0) },
                    ]}
                  >
                    {getStatusText(selectedRequest?.status || 0)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCloseModal}
                disabled={updating}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  updating && styles.modalSubmitButtonDisabled,
                ]}
                onPress={handleSubmitUpdate}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={22} color="#fff" />
                    <Text style={styles.modalSubmitButtonText}>Update</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  headerSpacer: {
    width: normalize(40),
    height: normalize(40),
  },
  content: {
    flex: 1,
  },
  requestsList: {
    padding: layout.screenPadding,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: normalize(16),
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: normalize(6),
    elevation: 4,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  requestTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    flex: 1,
  },
  requestTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#333",
  },
  requestType: {
    fontSize: fontSize.sm,
    color: "#999",
    marginTop: 4,
  },
  requestImageContainer: {
    marginVertical: spacing.md,
    borderRadius: normalize(12),
    overflow: "hidden",
  },
  requestImage: {
    width: "100%",
    height: normalize(200),
    backgroundColor: "#f0f0f0",
  },
  requestDescription: {
    fontSize: fontSize.md,
    color: "#666",
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  requestDetails: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.md,
    color: "#666",
  },
  requestFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: normalize(16),
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: normalize(12),
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  updateButtonText: {
    fontSize: fontSize.md,
    color: "#4A90E2",
    fontWeight: "700",
  },
  updateButtonDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#e0e0e0",
  },
  updateButtonTextDisabled: {
    color: "#999",
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    maxHeight: "90%",
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: "#333",
    marginBottom: spacing.md,
  },
  modalReadOnlyText: {
    fontSize: fontSize.md,
    color: "#666",
    backgroundColor: "#f5f5f5",
    padding: spacing.lg,
    borderRadius: normalize(12),
  },
  modalTextArea: {
    fontSize: fontSize.md,
    color: "#333",
    backgroundColor: "#f8f9ff",
    padding: spacing.lg,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: normalize(120),
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: normalize(12),
    borderWidth: 2,
    borderColor: "#4A90E2",
    borderStyle: "dashed",
    backgroundColor: "#f8f9ff",
  },
  imagePickerText: {
    fontSize: fontSize.md,
    color: "#4A90E2",
    fontWeight: "600",
  },
  currentImageContainer: {
    marginBottom: spacing.lg,
  },
  currentImageLabel: {
    fontSize: fontSize.sm,
    color: "#666",
    marginBottom: spacing.sm,
  },
  currentImage: {
    width: "100%",
    height: normalize(180),
    borderRadius: normalize(12),
    backgroundColor: "#f0f0f0",
  },
  newImageLabel: {
    fontSize: fontSize.sm,
    color: "#666",
    marginBottom: spacing.sm,
  },
  imagePreviewContainer: {
    marginTop: spacing.lg,
    position: "relative",
    borderRadius: normalize(12),
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: normalize(220),
    borderRadius: normalize(12),
  },
  removeImageButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: "#fff",
    borderRadius: normalize(16),
    padding: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalFooter: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  modalCancelButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: fontSize.md,
    color: "#666",
    fontWeight: "700",
  },
  modalSubmitButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: normalize(12),
    backgroundColor: "#4A90E2",
    alignItems: "center",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  modalSubmitButtonText: {
    fontSize: fontSize.md,
    color: "#fff",
    fontWeight: "700",
  },
  // Pagination styles
  paginationContainer: {
    padding: spacing.xl,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: spacing.lg,
  },
  paginationInfo: {
    alignItems: "center",
    gap: spacing.sm,
  },
  paginationText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#333",
  },
  paginationSubtext: {
    fontSize: fontSize.md,
    color: "#666",
  },
  paginationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  paginationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderColor: "#4A90E2",
    backgroundColor: "#fff",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paginationButtonDisabled: {
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
  },
  paginationButtonText: {
    fontSize: fontSize.md,
    color: "#4A90E2",
    fontWeight: "700",
  },
  paginationButtonTextDisabled: {
    color: "#ccc",
  },
});

export default RequestStatusScreen;
