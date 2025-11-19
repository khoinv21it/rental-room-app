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
import Toast from "react-native-toast-message";

type Props = {
  navigation: any;
};

interface RentalHistory {
  id: string;
  roomName: string;
  address: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  totalPaid: number;
  status: "completed" | "cancelled";
  rating?: number;
}

const RentalHistoryScreen = ({ navigation }: Props) => {
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const [history, setHistory] = useState<RentalHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // TODO: Call API to load rental history
      // const response = await getRentalHistory(currentUser?.id);
      // setHistory(response.data);

      // Mock data for now
      setHistory([
        {
          id: "1",
          roomName: "Phòng 205",
          address: "456 Lê Văn B, Q3, TP.HCM",
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          monthlyRent: 4500000,
          totalPaid: 54000000,
          status: "completed",
          rating: 5,
        },
        {
          id: "2",
          roomName: "Phòng 302",
          address: "789 Trần Văn C, Q5, TP.HCM",
          startDate: "2022-06-01",
          endDate: "2023-05-31",
          monthlyRent: 4000000,
          totalPaid: 48000000,
          status: "completed",
          rating: 4,
        },
      ]);
    } catch (error) {
      console.error("Error loading rental history:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load rental history",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={14}
            color="#FFB800"
          />
        ))}
      </View>
    );
  };

  const renderHistoryItem = (item: RentalHistory) => (
    <TouchableOpacity
      key={item.id}
      style={styles.historyCard}
      onPress={() => {
        // Navigate to history details
        console.log("View history:", item.id);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.historyHeader}>
        <View style={styles.historyTitleContainer}>
          <Ionicons name="home" size={20} color="#4A90E2" />
          <Text style={styles.historyTitle}>{item.roomName}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.historyDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.startDate} - {item.endDate}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#666" />
          <Text style={styles.detailText}>
            Total: {item.totalPaid.toLocaleString("vi-VN")} ₫
          </Text>
        </View>
        {item.rating && (
          <View style={styles.detailRow}>
            <Ionicons name="star" size={16} color="#FFB800" />
            {renderStars(item.rating)}
          </View>
        )}
      </View>

      <View style={styles.historyFooter}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text" size={16} color="#4A90E2" />
          <Text style={styles.actionButtonText}>View Receipt</Text>
        </TouchableOpacity>
        {item.status === "completed" && !item.rating && (
          <TouchableOpacity style={[styles.actionButton, styles.rateButton]}>
            <Ionicons name="star-outline" size={16} color="#FFB800" />
            <Text style={[styles.actionButtonText, { color: "#FFB800" }]}>
              Rate
            </Text>
          </TouchableOpacity>
        )}
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
        <Text style={styles.headerTitle}>Rental History</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading history...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No rental history</Text>
            <Text style={styles.emptySubtext}>
              Your past rentals will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map(renderHistoryItem)}
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
  historyList: {
    padding: layout.screenPadding,
  },
  historyCard: {
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
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  historyTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  historyTitle: {
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
    fontSize: fontSize.sm,
    color: "#666",
    flex: 1,
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
});

export default RentalHistoryScreen;
