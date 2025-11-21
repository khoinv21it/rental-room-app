import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  fontSize,
  layout,
  normalize,
  spacing,
} from "../../../utils/responsive";
import useAuthStore from "../../../Stores/useAuthStore";
import { fetchListContracts } from "../../../Services/ContractService";
import { ListContract } from "../../../types/types";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "..";

type Props = {
  navigation: any;
};

const MyContractsScreen = ({ navigation }: Props) => {
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const navigate = useNavigation<NavigationProp<RootStackParamList>>();
  const [contracts, setContracts] = useState<ListContract[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        const response = await fetchListContracts(currentUser?.id);
        setContracts(response || []);
      } catch (error) {
        console.error("Error loading contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [currentUser?.id]);
  const handleViewDetails = (contractId: string) => {
    navigate.navigate("ContractOverviewScreen", { contractId });
  };  

  // Status: 0 = Active (green), 2 = Expired (red), others = Pending (orange)
  const getStatusColor = (status: number | string) => {
    const s = typeof status === "string" ? parseInt(status) : status;
    if (s === 0) return "#4CAF50"; // green
    if (s === 2) return "#F44336"; // red
    return "#FF9800"; // orange
  };

  const getStatusText = (status: number | string) => {
    const s = typeof status === "string" ? parseInt(status) : status;
    if (s === 0) return "Active";
    if (s === 2) return "Expired";
    return "Pending";
  };

  const renderContract = (contract: ListContract) => (
    <TouchableOpacity
      key={contract.id}
      style={styles.contractCard}
      onPress={() => {
        // Navigate to contract details
        console.log("View contract:", contract.id);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.contractHeader}>
        <View style={styles.contractTitleContainer}>
          <Ionicons name="document-text" size={20} color="#4A90E2" />
          <Text style={styles.contractTitle}>{contract.roomTitle}</Text>
        </View>
      </View>

      <View style={styles.contractDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.detailText}>{contract.landlordName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {contract.startDate} - {contract.endDate}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#666" />
          <Text style={styles.detailText}>
            {contract.monthlyRent.toLocaleString("vi-VN")} ₫/month
          </Text>
        </View>
      </View>

      <View style={styles.contractFooter}>
        <View style={styles.statusFooterWrapper}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(contract.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(contract.status) },
              ]}
            >
              {getStatusText(contract.status)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            handleViewDetails(contract.id);
          }}
        >
          <Ionicons name="eye" size={16} color="#4A90E2" />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>My Contracts</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading contracts...</Text>
          </View>
        ) : contracts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No contracts found</Text>
            <Text style={styles.emptySubtext}>
              Your rental contracts will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.contractsList}>
            {contracts.map(renderContract)}
          </View>
        )}
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
  },
  contractsList: {
    padding: layout.screenPadding,
  },
  contractCard: {
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
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  contractTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  contractTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: normalize(12),
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  contractDetails: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: "#666",
    flex: 1,
  },
  contractFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusFooterWrapper: {
    flexDirection: "row",
    alignItems: "center",
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
  actionButtonText: {
    fontSize: fontSize.sm,
    color: "#4A90E2",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 2,
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
});

export default MyContractsScreen;
