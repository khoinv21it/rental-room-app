import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  downloadBillProof,
  fetchBillDetails,
  setStatusBill,
} from "../Services/BillService";
import { Bill, LandlordPaymentInfo, TenantInfo } from "../types/types";
import ImageModal from "./ImageModal";
import BillDetailModal from "./ModalBill";
import PaymentBill from "./PaymentBill";
import Toast from "react-native-toast-message";
import { set } from "react-hook-form";

// Helpers: format amounts and month string
const formatVND = (value?: number | string | null) => {
  const num = Number(value) || 0;
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(num);
  } catch (e) {
    // fallback
    return num.toLocaleString("vi-VN") + " ₫";
  }
};

const formatNumber = (value?: number | string | null) => {
  const num = Number(value) || 0;
  try {
    return new Intl.NumberFormat("vi-VN").format(num);
  } catch (e) {
    return num.toString();
  }
};
const formatMonth = (monthStr?: string | null) => {
  if (!monthStr) return "";
  // expect formats like "YYYY-MM" or "YYYY-MM-DD"
  const parts = monthStr.split("-");
  let date: Date;
  if (parts.length >= 2) {
    // construct first day of month
    date = new Date(`${parts[0]}-${parts[1]}-01`);
  } else {
    date = new Date(monthStr);
  }
  if (isNaN(date.getTime())) return monthStr;
  const monthName = new Intl.DateTimeFormat("en", { month: "long" }).format(
    date
  );
  return `${date.getFullYear()}-${monthName}`;
};

interface BillsTabProps {
  contractId: string;
  tenantInfo: TenantInfo;
  infoLandlord: LandlordPaymentInfo;
  navigation: any;
}

const BillsTab: React.FC<BillsTabProps> = ({
  contractId,
  tenantInfo,
  infoLandlord,
  navigation,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [bills, setBills] = useState<Bill[]>([]);
  const [unpaidAmount, setUnpaidAmount] = useState<number>(0);
  const [totalBills, setTotalBills] = useState<number>(0);
  const [paidBills, setPaidBills] = useState<number>(0);
  const [pendingBills, setPendingBills] = useState<number>(0);
  const [confirmingBills, setConfirmingBills] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const [billDetailVisible, setBillDetailVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const fetchBills = async () => {
      const response = await fetchBillDetails(contractId);
      if (response) {
        setBills(response);
      } else {
        setBills([]);
      }
      setRefreshing(false);
    };
    fetchBills();
  }, [contractId]);
  // Thêm handler
  const handleViewDetails = (bill: Bill) => {
    setSelectedBill(bill);
    setBillDetailVisible(true);
  };

  const handelConfirm = async (billId: string) => {
    console.log("Confirming payment for bill aa:", billId);
    const response = await setStatusBill(billId, "CONFIRMING");
    console.log("Response from setStatusBill:", response);
    if (response) {
      // Update local state
      const updatedBills = bills.map((bill) =>
        bill.id === billId ? { ...bill, status: "CONFIRMING" } : bill
      );
      Toast.show({
        type: "success",
        text1: "Payment confirmed",
        text2: "Your payment is being confirmed by the landlord.",
      });
      setBills(updatedBills);
      setPaymentModal(false);
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to confirm payment. Please try again.",
      });
    }
  };
  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchBills = async () => {
      const response = await fetchBillDetails(contractId);
      if (response) {
        setBills(response);
      } else {
        setBills([]);
      }
    };
    fetchBills();
  }, [contractId]);

  useEffect(() => {
    // Calculate summary stats
    let unpaid = 0;
    let total = bills.length;
    let paid = 0;
    let pending = 0;
    let confirming = 0;
    bills.forEach((bill) => {
      if (bill.status === "PAID") {
        paid += 1;
      } else if (bill.status === "PENDING") {
        pending += 1;
        unpaid += bill.totalAmount || 0;
      } else if (bill.status === "CONFIRMING") {
        confirming += 1;
      }
    });
    setUnpaidAmount(unpaid);
    setTotalBills(total);
    setPaidBills(paid);
    setPendingBills(pending);
    setConfirmingBills(confirming);
  }, [bills]);

  // derive filtered list based on selectedFilter
  const filteredBills = bills.filter((bill) =>
    selectedFilter === "All" ? true : bill.status === selectedFilter
  );

  const handleDownload = async (billId: string) => {
    try {
      const response = await downloadBillProof(billId);
      if (response) {
        const canOpen = await Linking.canOpenURL(response);
        if (canOpen) {
          await Linking.openURL(response);
        } else {
          Alert.alert("Error", "Cannot open PDF URL");
        }
      } else {
        Alert.alert("Error", "Failed to get bill PDF URL");
      }
    } catch (error) {
      console.error("Error downloading bill proof:", error);
      Alert.alert("Error", "Failed to download bill proof");
    }
  };
  const handlePay = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentModal(true);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "#22c55e";
      case "PENDING":
        return "#f59e0b";
      case "CONFIRMING":
        return "#2563eb";
      default:
        return "#64748b";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "rgba(34, 197, 94, 0.1)";
      case "PENDING":
        return "rgba(245, 158, 11, 0.1)";
      case "CONFIRMING":
        return "rgba(37, 99, 235, 0.1)";
      default:
        return "#f1f5f9";
    }
  };
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons
            name="receipt-text"
            size={24}
            color="#6366f1"
          />
          <Text style={styles.summaryValue}>{totalBills}</Text>
          <Text style={styles.summaryLabel}>Total Bills</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color="#22c55e"
          />
          <Text style={[styles.summaryValue, { color: "#22c55e" }]}>
            {paidBills}
          </Text>
          <Text style={styles.summaryLabel}>Paid</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={24}
            color="#f59e0b"
          />
          <Text style={[styles.summaryValue, { color: "#f59e0b" }]}>
            {pendingBills}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons
            name="progress-clock"
            size={24}
            color="#2563eb"
          />
          <Text style={[styles.summaryValue, { color: "#2563eb" }]}>
            {confirmingBills}
          </Text>
          <Text style={styles.summaryLabel}>Confirming</Text>
        </View>
      </View>

      {/* Unpaid Amount Banner */}
      {parseFloat(unpaidAmount.toString().replace(/[^\d]/g, "")) > 0 && (
        <View style={styles.unpaidBanner}>
          <View style={styles.unpaidLeft}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color="#f59e0b"
            />
            <View style={styles.unpaidInfo}>
              <Text style={styles.unpaidLabel}>Unpaid Amount</Text>
              <Text style={styles.unpaidValue}>{formatVND(unpaidAmount)}</Text>
            </View>
          </View>
        </View>
      )}
      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Bills History</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {["All", "PAID", "PENDING", "CONFIRMING"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No bills to display.</Text>
        </View>
      ) : (
        filteredBills.map((bill) => (
          <View style={styles.billCard} key={bill.id}>
            {/* Header */}
            <View style={styles.billHeader}>
              <View style={styles.billMonth}>
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={20}
                  color="#6366f1"
                />
                <Text style={styles.billMonthText}>
                  {formatMonth(bill.month)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBgColor(bill.status) },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(bill.status) },
                  ]}
                >
                  {bill.status}
                </Text>
              </View>
            </View>

            {/* Bill Details */}
            <View style={styles.billDetails}>
              {/* Electricity + Water */}
              <View style={styles.detailRow}>
                {/* Electricity */}
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={18}
                    color="#f59e0b"
                  />
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>Electricity</Text>
                    <Text style={styles.detailValue}>
                      {formatVND(bill.electricityFee)}
                    </Text>
                    <Text style={styles.detailSubtext}>
                      {bill.electricityUsage || 0} kWh ×
                      {formatNumber(bill.electricityPrice)} đ/kWh
                    </Text>
                  </View>
                </View>

                {/* Water */}
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="water"
                    size={18}
                    color="#3b82f6"
                  />
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>Water</Text>
                    <Text style={styles.detailValue}>
                      {formatVND(bill.waterFee)}
                    </Text>
                    <Text style={styles.detailSubtext}>
                      {bill.waterUsage || 0} m³ ×{" "}
                      {formatNumber(bill.waterPrice)} đ/m³
                    </Text>
                  </View>
                </View>
              </View>

              {/* Service + Other */}
              <View style={styles.detailRow}>
                {/* Service Fee */}
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons
                    name="cog"
                    size={18}
                    color="#8b5cf6"
                  />
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>Service</Text>
                    <Text style={styles.detailValue}>
                      {formatVND(bill.serviceFee)}
                    </Text>
                  </View>
                </View>

                {/* Other / Damage Fee */}
                {bill.damageFee > 0 && (
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={18}
                      color="#dc2626"
                    />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Other Fee</Text>
                      <Text style={styles.detailValue}>
                        {formatVND(bill.damageFee)}
                      </Text>
                      {!!bill.note && (
                        <Text style={styles.detailSubtext}>{bill.note}</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.billDivider} />

            {/* Footer */}
            <View style={styles.billFooter}>
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  {formatVND(bill.totalAmount)}
                </Text>
              </View>
              <View style={styles.billActions}>
                {bill.imageProof && (
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={() => {
                      handleViewImage(bill.imageProof!);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="image"
                      size={18}
                      color="#6366f1"
                    />
                  </TouchableOpacity>
                )}

                {/* icon eyee */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => {
                      handleViewDetails(bill);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="eye-outline"
                      size={18}
                      color="#6366f1"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => {
                      handleDownload(bill.id!);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="download-outline"
                      size={16}
                      color="#6366f1"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      (bill.status === "PAID" ||
                        bill.status === "CONFIRMING") &&
                        styles.payButtonDisabled,
                    ]}
                    onPress={() => {
                      handlePay(bill);
                    }}
                    disabled={
                      bill.status === "PAID" || bill.status === "CONFIRMING"
                    }
                  >
                    <Text style={styles.payButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Payment Info */}
      <View style={styles.paymentInfoCard}>
        <View style={styles.paymentHeader}>
          <MaterialCommunityIcons
            name="information"
            size={22}
            color="#6366f1"
          />
          <Text style={styles.paymentTitle}>Payment Information</Text>
        </View>
        <View style={styles.paymentMethods}>
          <View style={styles.paymentMethod}>
            <MaterialCommunityIcons
              name="cellphone"
              size={18}
              color="#22c55e"
            />
            <Text style={styles.paymentMethodText}>
              Online payment via mobile banking apps
            </Text>
          </View>
          <View style={styles.paymentMethod}>
            <MaterialCommunityIcons name="bank" size={18} color="#3b82f6" />
            <Text style={styles.paymentMethodText}>
              Bank transfer to landlord's account
            </Text>
          </View>
          <View style={styles.paymentMethod}>
            <MaterialCommunityIcons name="cash" size={18} color="#f59e0b" />
            <Text style={styles.paymentMethodText}>
              Cash payment (contact landlord)
            </Text>
          </View>
        </View>
        <View style={styles.paymentNote}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={16}
            color="#ef4444"
          />
          <Text style={styles.paymentNoteText}>
            Please pay your bills before the due date to avoid late fees.
            Contact your landlord if you have any payment issues.
          </Text>
        </View>
      </View>

      <View style={{ height: 20 }} />
      <PaymentBill
        visible={paymentModal}
        infoLandlord={infoLandlord}
        bill={selectedBill!}
        totalAmount={selectedBill ? selectedBill.totalAmount || 0 : 0}
        onClose={() => setPaymentModal(false)}
        onConfirm={(billId) => handelConfirm(billId)}
      />
      <ImageModal
        visible={modalVisible}
        imageUrl={selectedImage}
        onClose={() => setModalVisible(false)}
      />
      {/* ModalBill component for bill details */}
      <BillDetailModal
        visible={billDetailVisible}
        bill={selectedBill}
        tenantInfo={tenantInfo}
        onClose={() => setBillDetailVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 16,
  },
  summaryCard: {
    width: "50%",
    alignItems: "center",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  summaryCardInner: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  unpaidBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fbbf24",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  unpaidLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  unpaidInfo: {
    marginLeft: 10,
  },
  unpaidLabel: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "600",
  },
  unpaidValue: {
    fontSize: 18,
    color: "#ef4444",
    fontWeight: "700",
    marginTop: 2,
  },
  payButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonDisabled: {
    backgroundColor: "#a5b4fc",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  filterSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: "row",
  },
  filterChip: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterChipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  filterChipText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  billCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  billMonth: {
    flexDirection: "row",
    alignItems: "center",
  },
  billMonthText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  billDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailText: {
    flex: 1,
    marginLeft: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  detailSubtext: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 1,
  },
  billDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  billFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  billActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 4,
  },
  paginationText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 13,
    marginVertical: 16,
  },
  paymentInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 8,
  },
  paymentMethods: {
    marginBottom: 14,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
    marginLeft: 10,
    lineHeight: 20,
  },
  paymentNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
  },
  paymentNoteText: {
    flex: 1,
    fontSize: 13,
    color: "#991b1b",
    marginLeft: 8,
    lineHeight: 18,
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyStateText: {
    color: "#64748b",
    fontSize: 14,
  },
});

export default BillsTab;
