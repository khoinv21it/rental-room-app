import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Bill, TenantInfo } from "../types/types";
import { SafeAreaView } from "react-native-safe-area-context";

export type BillDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  bill: Bill | null;
  tenantInfo: TenantInfo;
};

const formatVND = (value?: number | string | null) => {
  const num = Number(value) || 0;
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(num);
  } catch (e) {
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

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB");
};

const BillDetailModal: React.FunctionComponent<BillDetailModalProps> = ({
  visible,
  onClose,
  tenantInfo,
  bill,
}) => {
  if (!bill) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={["bottom"]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>RENTAL BILL</Text>
              <Text style={styles.subtitle}>RENTAL BILL</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Bill Info */}
            <View style={styles.billInfo}>
              <Text style={styles.infoText}>
                Date: {formatDate(bill.month)}
              </Text>
              <Text style={styles.infoText}>Bill ID: {bill.id}</Text>
            </View>

            <View style={styles.divider} />

            {/* Customer Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CUSTOMER INFORMATION</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <View style={styles.infoColFull}>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.value}>{tenantInfo.name}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.label}>Phone:</Text>
                    <Text style={styles.value}>
                      {tenantInfo.phone || "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoColFull}>
                    <Text style={styles.label}>Room:</Text>
                    <Text style={styles.value}>{tenantInfo.roomTitle}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.label}>Month:</Text>
                    <Text style={[styles.value, styles.monthValue]}>
                      {bill.month}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Bill Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BILL DETAILS</Text>

              <View style={styles.table}>
                {/* Header */}
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Item</Text>
                  <Text style={styles.tableHeaderText}>Amount</Text>
                </View>

                {/* Electricity */}
                <View style={styles.tableRow}>
                  <View style={styles.tableItemCol}>
                    <Text style={styles.tableItemTitle}>Electricity</Text>
                    <Text style={styles.tableItemSubtext}>
                      {bill.electricityUsage || 0} kWh ×
                      {formatNumber(bill.electricityPrice)} đ/kWh
                    </Text>
                  </View>
                  <Text style={styles.tableAmount}>
                    {formatVND(bill.electricityFee)}
                  </Text>
                </View>

                {/* Water */}
                <View style={styles.tableRow}>
                  <View style={styles.tableItemCol}>
                    <Text style={styles.tableItemTitle}>Water</Text>
                    <Text style={styles.tableItemSubtext}>
                      {bill.waterUsage || 0} m³ ×{formatNumber(bill.waterPrice)}{" "}
                      đ/m³
                    </Text>
                  </View>
                  <Text style={styles.tableAmount}>
                    {formatVND(bill.waterFee)}
                  </Text>
                </View>

                {/* Service Fee */}
                <View style={styles.tableRow}>
                  <View style={styles.tableItemCol}>
                    <Text style={styles.tableItemTitle}>Service Fee</Text>
                  </View>
                  <Text style={styles.tableAmount}>
                    {formatVND(bill.serviceFee)}
                  </Text>
                </View>

                {/* Damage Fee if exists */}
                <View style={styles.tableRow}>
                  <View style={styles.tableItemCol}>
                    <Text style={styles.tableItemTitle}>Other Fee</Text>
                    {bill.note && (
                      <Text style={styles.tableItemSubtext}>{bill.note}</Text>
                    )}
                  </View>
                  <Text style={styles.tableAmount}>
                    {formatVND(bill.damageFee)}
                  </Text>
                </View>

                {/* Total */}
                <View style={styles.tableTotal}>
                  <Text style={styles.totalLabel}>TOTAL</Text>
                  <Text style={styles.totalAmount}>
                    {formatVND(bill.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Footer Message */}
            <View style={styles.footer}>
              <Text style={styles.footerTitle}>
                Thank you for trusting and using our services!
              </Text>
              {/* <Text style={styles.footerSubtext}>
                Please pay on time. Contact: {info}
              </Text> */}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Dimensions.get("window").height * 0.9,
    paddingTop: 20,
    // ensure modal stretches horizontally
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    top: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  billInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoColFull: {
    flex: 2,
  },
  label: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  monthValue: {
    color: "#6366f1",
  },
  table: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableItemCol: {
    flex: 1,
    paddingRight: 12,
  },
  tableItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  tableItemSubtext: {
    fontSize: 11,
    color: "#94a3b8",
  },
  tableAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  tableTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#f1f5f9",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366f1",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
});

export default BillDetailModal;
