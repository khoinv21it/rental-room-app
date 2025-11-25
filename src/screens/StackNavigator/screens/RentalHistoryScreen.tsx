import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
import { userFetchBookings } from "../../../Services/BookingService";
import { useFocusEffect } from "@react-navigation/native";
import { BookingData } from "../../../types/types";

type Props = {
  navigation: any;
};

const RentalHistoryScreen = ({ navigation }: Props) => {
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Refresh bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) {
        loadBookings(pagination.current);
      }
    }, [currentUser?.id])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings(1).then(() => setRefreshing(false));
  }, []);

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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
});

export default RentalHistoryScreen;
