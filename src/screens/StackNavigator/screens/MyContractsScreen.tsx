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

type Props = {
  navigation: any;
};

interface Contract {
  id: string;
  roomName: string;
  address: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: "active" | "expired" | "pending";
}

const MyContractsScreen = ({ navigation }: Props) => {
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      // TODO: Call API to load contracts
      // const response = await getMyContracts(currentUser?.id);
      // setContracts(response.data);

      // Mock data for now
      setContracts([
        {
          id: "1",
          roomName: "Phòng 101",
          address: "123 Nguyễn Văn A, Q1, TP.HCM",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          monthlyRent: 5000000,
          status: "active",
        },
      ]);
    } catch (error) {
      console.error("Error loading contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "expired":
        return "#F44336";
      case "pending":
        return "#FF9800";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "expired":
        return "Expired";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  const renderContract = (contract: Contract) => (
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
          <Text style={styles.contractTitle}>{contract.roomName}</Text>
        </View>
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

      <View style={styles.contractDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>{contract.address}</Text>
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
        <TouchableOpacity style={styles.actionButton}>
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
    justifyContent: "flex-end",
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
