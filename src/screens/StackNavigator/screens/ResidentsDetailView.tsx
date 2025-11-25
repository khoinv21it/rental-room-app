import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  fontSize,
  layout,
  normalize,
  spacing,
} from "../../../utils/responsive";
import { URL_IMAGE } from "../../../Services/Constants";
import { fetchContractDetail } from "../../../Services/ContractService";
import Toast from "react-native-toast-message";
import { Resident, ContractInfo } from "../../../types/types";

interface Props {
  navigation: any;
  route: {
    params: {
      resident: Resident;
    };
  };
}

// Helper function to convert Cloudinary relative path to full URL
const getCloudinaryUrl = (relativePath: string): string => {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  return `${URL_IMAGE}${relativePath}`;
};

const ResidentsDetailView = ({ navigation, route }: Props) => {
  const { resident } = route.params;
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);

  // Load contract information
  useEffect(() => {
    loadContractInfo();
  }, [resident.contractId]);

  const loadContractInfo = async () => {
    if (!resident.contractId) return;

    try {
      setLoadingContract(true);
      const contract = await fetchContractDetail(resident.contractId);
      console.log("Contract info loaded:", contract);
      setContractInfo(contract);
    } catch (error) {
      console.error("Failed to load contract:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load contract information",
      });
    } finally {
      setLoadingContract(false);
    }
  };

  const getRelationshipColor = (relationship: string) => {
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

  const isActive = () => {
    const endDate = new Date(resident.endDate);
    const now = new Date();
    return endDate >= now && resident.status !== "DONE";
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
        <Text style={styles.headerTitle}>Resident Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {(resident.fullName || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.residentName}>{resident.fullName}</Text>
          <View style={styles.badgesRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    getRelationshipColor(resident.relationship) + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: getRelationshipColor(resident.relationship) },
                ]}
              >
                {resident.relationship}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: getStatusColor(resident.status) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: getStatusColor(resident.status) },
                ]}
              >
                {resident.status}
              </Text>
            </View>
            {isActive() && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
        </View>

        {/* Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="card" size={20} color="#4A90E2" />
            <Text style={styles.infoLabel}>ID Number</Text>
            <Text style={styles.infoValue}>{resident.idNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#4A90E2" />
            <Text style={styles.infoLabel}>Start Date</Text>
            <Text style={styles.infoValue}>
              {new Date(resident.startDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
            <Text style={styles.infoLabel}>End Date</Text>
            <Text style={styles.infoValue}>
              {new Date(resident.endDate).toLocaleDateString()}
            </Text>
          </View>

          {resident.note && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text" size={20} color="#4A90E2" />
              <Text style={styles.infoLabel}>Note</Text>
              <Text style={styles.infoValue}>{resident.note}</Text>
            </View>
          )}
        </View>

        {/* ID Card Images */}
        {(resident.idCardFrontUrl || resident.idCardBackUrl) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ID Card Images</Text>

            {resident.idCardFrontUrl && (
              <View style={styles.imageSection}>
                <Text style={styles.imageLabel}>Front Side</Text>
                <Image
                  source={{ uri: getCloudinaryUrl(resident.idCardFrontUrl) }}
                  style={styles.idCardImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {resident.idCardBackUrl && (
              <View style={styles.imageSection}>
                <Text style={styles.imageLabel}>Back Side</Text>
                <Image
                  source={{ uri: getCloudinaryUrl(resident.idCardBackUrl) }}
                  style={styles.idCardImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        )}

        {/* Contract Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contract Information</Text>

          {loadingContract ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.loadingText}>Loading contract info...</Text>
            </View>
          ) : contractInfo ? (
            <>
              {contractInfo.contractName && (
                <View style={styles.infoRow}>
                  <Ionicons name="document-text" size={20} color="#4A90E2" />
                  <Text style={styles.infoLabel}>Contract Name</Text>
                  <Text style={styles.infoValue}>
                    {contractInfo.contractName}
                  </Text>
                </View>
              )}

              {contractInfo.roomTitle && (
                <View style={styles.infoRow}>
                  <Ionicons name="home" size={20} color="#4A90E2" />
                  <Text style={styles.infoLabel}>Room</Text>
                  <Text style={styles.infoValue}>{contractInfo.roomTitle}</Text>
                </View>
              )}

              {contractInfo.roomAddress && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color="#4A90E2" />
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>
                    {contractInfo.roomAddress}
                  </Text>
                </View>
              )}

              {contractInfo.monthlyRent && (
                <View style={styles.infoRow}>
                  <Ionicons name="cash" size={20} color="#4CAF50" />
                  <Text style={styles.infoLabel}>Monthly Rent</Text>
                  <Text style={[styles.infoValue, styles.priceText]}>
                    {contractInfo.monthlyRent.toLocaleString("vi-VN")} ₫
                  </Text>
                </View>
              )}

              {contractInfo.startDate && contractInfo.endDate && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color="#4A90E2" />
                  <Text style={styles.infoLabel}>Contract Period</Text>
                  <Text style={styles.infoValue}>
                    {new Date(contractInfo.startDate).toLocaleDateString()} -{" "}
                    {new Date(contractInfo.endDate).toLocaleDateString()}
                  </Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Ionicons name="document" size={20} color="#4A90E2" />
                <Text style={styles.infoLabel}>Contract ID</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {resident.contractId}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="document" size={20} color="#4A90E2" />
              <Text style={styles.infoLabel}>Contract ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {resident.contractId}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    padding: layout.screenPadding * 1.2,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: normalize(20),
    padding: spacing.xl * 2,
    marginBottom: spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: normalize(4),
    elevation: 3,
  },
  avatarLarge: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: normalize(8),
    elevation: 6,
  },
  avatarLargeText: {
    fontSize: fontSize["4xl"],
    color: "#fff",
    fontWeight: "700",
  },
  residentName: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: "#333",
    marginBottom: spacing.md,
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: normalize(12),
  },
  badgeText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: normalize(16),
    backgroundColor: "#E8F5E9",
    gap: spacing.sm,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: normalize(4),
    elevation: 2,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
  },
  activeBadgeText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: "#4CAF50",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: normalize(16),
    padding: spacing.xl * 1.5,
    marginBottom: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: normalize(6),
    elevation: 4,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: "#333",
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "#4A90E2",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: "#f8f9fa",
    borderRadius: normalize(8),
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: "#666",
    fontWeight: "600",
    width: normalize(110),
    marginLeft: spacing.sm,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: "#333",
    flex: 1,
    fontWeight: "500",
    lineHeight: fontSize.md * 1.4,
  },
  priceText: {
    color: "#4CAF50",
    fontWeight: "700",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: "#999",
  },
  imageSection: {
    marginBottom: spacing.xl,
  },
  imageLabel: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#333",
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },
  idCardImage: {
    width: "100%",
    height: normalize(220),
    borderRadius: normalize(12),
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
});

export default ResidentsDetailView;
