import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import React, { useState, useEffect, useCallback } from "react";
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
  getByTenant,
  createResident,
  updateResident,
  deleteResident,
} from "../../../Services/ResidentService";
import { useFocusEffect } from "@react-navigation/native";

type Props = {
  navigation: any;
};

interface Resident {
  id: string;
  fullName: string;
  idNumber: string;
  relationship: string;
  startDate: string;
  endDate: string;
  note?: string;
  status: string;
  contractId: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
}

const ResidentsScreen = ({ navigation }: Props) => {
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(
    null
  );

  // Image state
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    relationship: "Bản thân",
    startDate: "",
    endDate: "",
    note: "",
    contractId: "",
  });

  // Refresh residents when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) {
        loadResidents();
      }
    }, [currentUser?.id])
  );

  const loadResidents = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      console.log("Loading residents for tenant:", currentUser.id);
      const data = await getByTenant(currentUser.id);
      console.log("Residents loaded:", data);
      setResidents(data || []);
    } catch (error: any) {
      console.error("Error loading residents:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load residents",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      idNumber: "",
      relationship: "Bản thân",
      startDate: "",
      endDate: "",
      note: "",
      contractId: "",
    });
    setFrontImageUri(null);
    setBackImageUri(null);
  };

  const pickFrontImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "We need camera roll permissions to upload images",
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
      setFrontImageUri(result.assets[0].uri);
    }
  };

  const pickBackImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Permission Denied",
        text2: "We need camera roll permissions to upload images",
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
      setBackImageUri(result.assets[0].uri);
    }
  };

  const handleAddResident = async () => {
    if (!formData.fullName || !formData.idNumber || !formData.contractId) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill in all required fields",
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please select start and end dates",
      });
      return;
    }

    try {
      setLoading(true);
      await createResident(
        formData.contractId,
        formData,
        frontImageUri || undefined,
        backImageUri || undefined
      );
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Resident added successfully",
      });
      setShowAddModal(false);
      resetForm();
      loadResidents();
    } catch (error: any) {
      console.error("Error adding resident:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to add resident",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditResident = async () => {
    if (!selectedResident) return;

    if (!formData.fullName || !formData.idNumber) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill in all required fields",
      });
      return;
    }

    try {
      setLoading(true);
      await updateResident(
        selectedResident.id,
        selectedResident.contractId,
        formData,
        frontImageUri || undefined,
        backImageUri || undefined
      );
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Resident updated successfully",
      });
      setShowEditModal(false);
      setSelectedResident(null);
      resetForm();
      loadResidents();
    } catch (error: any) {
      console.error("Error updating resident:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update resident",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResident = (resident: Resident) => {
    Alert.alert(
      "Delete Resident",
      `Are you sure you want to delete ${resident.fullName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteResident(resident.id);
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Resident deleted successfully",
              });
              loadResidents();
            } catch (error: any) {
              console.error("Error deleting resident:", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Failed to delete resident",
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (resident: Resident) => {
    setSelectedResident(resident);
    setFormData({
      fullName: resident.fullName,
      idNumber: resident.idNumber,
      relationship: resident.relationship,
      startDate: resident.startDate.split("T")[0], // Format to YYYY-MM-DD
      endDate: resident.endDate.split("T")[0],
      note: resident.note || "",
      contractId: resident.contractId,
    });
    setShowEditModal(true);
  };

  const getRelationshipColor = (relationship: string) => {
    // Map to colors based on relationship type
    const lowerRelationship = relationship.toLowerCase();
    if (
      lowerRelationship.includes("bản thân") ||
      lowerRelationship.includes("tenant")
    ) {
      return "#2196F3";
    } else if (
      lowerRelationship.includes("vợ") ||
      lowerRelationship.includes("chồng")
    ) {
      return "#E91E63";
    } else if (lowerRelationship.includes("con")) {
      return "#4CAF50";
    } else if (
      lowerRelationship.includes("bố") ||
      lowerRelationship.includes("mẹ")
    ) {
      return "#9C27B0";
    }
    return "#FF9800";
  };

  const getRelationshipText = (relationship: string) => {
    return relationship || "Other";
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DONE":
        return "#4CAF50";
      case "PENDING":
        return "#FF9800";
      default:
        return "#999";
    }
  };

  const filteredResidents = residents.filter(
    (resident) =>
      resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.idNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.relationship.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.note?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderResident = (resident: Resident) => {
    return (
      <TouchableOpacity
        key={resident.id}
        style={styles.residentCard}
        onPress={() => {
          navigation.navigate("ResidentsDetailView", { resident });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.residentHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(resident.fullName || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.residentInfo}>
            <Text style={styles.residentName}>{resident.fullName}</Text>
            <View style={styles.residentMetaRow}>
              <View
                style={[
                  styles.relationshipBadge,
                  {
                    backgroundColor:
                      getRelationshipColor(resident.relationship) + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.relationshipText,
                    { color: getRelationshipColor(resident.relationship) },
                  ]}
                >
                  {getRelationshipText(resident.relationship)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(resident.status) + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(resident.status) },
                  ]}
                >
                  {resident.status || "PENDING"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => {
                navigation.navigate("ResidentsDetailView", { resident });
              }}
            >
              <Ionicons name="eye" size={18} color="#4A90E2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal(resident)}
            >
              <Ionicons name="create" size={18} color="#FF9800" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteResident(resident)}
            >
              <Ionicons name="trash" size={18} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.residentDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="card" size={14} color="#666" />
            <Text style={styles.detailText}>ID: {resident.idNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.detailText}>
              {new Date(resident.startDate).toLocaleDateString()} -{" "}
              {new Date(resident.endDate).toLocaleDateString()}
            </Text>
          </View>
          {resident.note && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text" size={14} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>
                {resident.note}
              </Text>
            </View>
          )}
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
        <Text style={styles.headerTitle}>Residents</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add-circle" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.emptyText}>Loading residents...</Text>
          </View>
        ) : filteredResidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No residents found" : "No residents"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try a different search term"
                : "Your roommates will appear here"}
            </Text>
          </View>
        ) : (
          <View style={styles.residentsList}>
            <Text style={styles.sectionTitle}>
              {filteredResidents.length} Resident
              {filteredResidents.length !== 1 ? "s" : ""}
            </Text>
            {filteredResidents.map(renderResident)}
          </View>
        )}
      </ScrollView>

      {/* Add Resident Modal - Simplified for now */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Resident</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData({ ...formData, fullName: text })
                }
              />

              <Text style={styles.inputLabel}>ID Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter ID number"
                value={formData.idNumber}
                onChangeText={(text) =>
                  setFormData({ ...formData, idNumber: text })
                }
              />

              <Text style={styles.inputLabel}>Relationship *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.relationship}
                  onValueChange={(value) =>
                    setFormData({ ...formData, relationship: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Bản thân" value="Bản thân" />
                  <Picker.Item label="Vợ/Chồng" value="Vợ/Chồng" />
                  <Picker.Item label="Con" value="Con" />
                  <Picker.Item label="Bố/Mẹ" value="Bố/Mẹ" />
                  <Picker.Item label="Anh/Em" value="Anh/Em" />
                  <Picker.Item label="Bạn bè" value="Bạn bè" />
                  <Picker.Item label="Khác" value="Khác" />
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Contract ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter contract ID"
                value={formData.contractId}
                onChangeText={(text) =>
                  setFormData({ ...formData, contractId: text })
                }
              />

              <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-01"
                value={formData.startDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, startDate: text })
                }
              />

              <Text style={styles.inputLabel}>End Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-12-31"
                value={formData.endDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, endDate: text })
                }
              />

              {/* ID Card Upload */}
              <Text style={styles.inputLabel}>ID Card Images (Optional)</Text>
              <View style={styles.imageUploadContainer}>
                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={pickFrontImage}
                >
                  {frontImageUri ? (
                    <View style={styles.imagePreviewContainer}>
                      <Text style={styles.imagePreviewText}>Front ✓</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="camera" size={24} color="#4A90E2" />
                      <Text style={styles.imageUploadText}>Front ID</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={pickBackImage}
                >
                  {backImageUri ? (
                    <View style={styles.imagePreviewContainer}>
                      <Text style={styles.imagePreviewText}>Back ✓</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="camera" size={24} color="#4A90E2" />
                      <Text style={styles.imageUploadText}>Back ID</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Note</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter note"
                value={formData.note}
                onChangeText={(text) =>
                  setFormData({ ...formData, note: text })
                }
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddResident}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Resident</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Resident Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Resident</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData({ ...formData, fullName: text })
                }
              />

              <Text style={styles.inputLabel}>ID Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter ID number"
                value={formData.idNumber}
                onChangeText={(text) =>
                  setFormData({ ...formData, idNumber: text })
                }
              />

              <Text style={styles.inputLabel}>Relationship *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.relationship}
                  onValueChange={(value) =>
                    setFormData({ ...formData, relationship: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Bản thân" value="Bản thân" />
                  <Picker.Item label="Vợ/Chồng" value="Vợ/Chồng" />
                  <Picker.Item label="Con" value="Con" />
                  <Picker.Item label="Bố/Mẹ" value="Bố/Mẹ" />
                  <Picker.Item label="Anh/Em" value="Anh/Em" />
                  <Picker.Item label="Bạn bè" value="Bạn bè" />
                  <Picker.Item label="Khác" value="Khác" />
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-01"
                value={formData.startDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, startDate: text })
                }
              />

              <Text style={styles.inputLabel}>End Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-12-31"
                value={formData.endDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, endDate: text })
                }
              />

              {/* ID Card Upload */}
              <Text style={styles.inputLabel}>ID Card Images (Optional)</Text>
              <View style={styles.imageUploadContainer}>
                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={pickFrontImage}
                >
                  {frontImageUri ? (
                    <View style={styles.imagePreviewContainer}>
                      <Text style={styles.imagePreviewText}>Front ✓</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="camera" size={24} color="#4A90E2" />
                      <Text style={styles.imageUploadText}>Front ID</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={pickBackImage}
                >
                  {backImageUri ? (
                    <View style={styles.imagePreviewContainer}>
                      <Text style={styles.imagePreviewText}>Back ✓</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="camera" size={24} color="#4A90E2" />
                      <Text style={styles.imageUploadText}>Back ID</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Note</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter note"
                value={formData.note}
                onChangeText={(text) =>
                  setFormData({ ...formData, note: text })
                }
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleEditResident}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Resident</Text>
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
  headerRight: {
    width: normalize(40),
  },
  searchContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: normalize(10),
    paddingHorizontal: spacing.md,
    height: normalize(44),
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: "#333",
  },
  content: {
    flex: 1,
  },
  residentsList: {
    padding: layout.screenPadding,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: "#999",
    fontWeight: "600",
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  residentCard: {
    backgroundColor: "#fff",
    borderRadius: normalize(12),
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: normalize(4),
    elevation: 3,
  },
  residentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSize.lg,
    color: "#fff",
    fontWeight: "600",
  },
  residentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  residentName: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: "#333",
    marginBottom: spacing.xs,
  },
  residentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  relationshipBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: normalize(8),
  },
  relationshipText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  roomName: {
    fontSize: fontSize.sm,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: normalize(8),
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  chatButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2FF",
    borderRadius: normalize(20),
  },
  viewButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2FF",
    borderRadius: normalize(20),
  },
  residentDetails: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: "#666",
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
  addButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  editButton: {
    width: normalize(36),
    height: normalize(36),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8E1",
    borderRadius: normalize(18),
  },
  deleteButton: {
    width: normalize(36),
    height: normalize(36),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: normalize(18),
  },
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: "#333",
  },
  modalBody: {
    padding: spacing.xl,
  },
  modalFooter: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: "#333",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: normalize(10),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pickerContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  picker: {
    height: Platform.OS === "ios" ? normalize(180) : normalize(50),
    width: "100%",
  },
  textArea: {
    height: normalize(80),
    textAlignVertical: "top",
  },
  imageUploadContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  imageUploadButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: normalize(100),
  },
  imageUploadText: {
    fontSize: fontSize.sm,
    color: "#666",
    marginTop: spacing.xs,
  },
  imagePreviewContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreviewText: {
    fontSize: fontSize.md,
    color: "#4A90E2",
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: "#666",
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: normalize(10),
    backgroundColor: "#4A90E2",
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: "#fff",
  },
});

export default ResidentsScreen;
