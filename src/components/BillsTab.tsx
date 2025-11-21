import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Bill {
  id: string;
  month: string;
  electricity: string;
  electricityDetail: string;
  water: string;
  waterDetail: string;
  service: string;
  serviceDetail?: string;
  total: string;
  status: string;
  image?: string;
  actions?: string;
}

interface BillsTabProps {
  totalBills: number;
  paidBills: number;
  pendingBills: number;
  confirmingBills: number;
  unpaidAmount: string;
  bills: Bill[];
}

const BillsTab: React.FC<BillsTabProps> = ({
  totalBills,
  paidBills,
  pendingBills,
  confirmingBills,
  unpaidAmount,
  bills,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Bills</Text>
          <Text style={styles.summaryValue}>{totalBills}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Paid Bills</Text>
          <Text style={[styles.summaryValue, { color: "#22c55e" }]}>
            {paidBills}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending Bills</Text>
          <Text style={[styles.summaryValue, { color: "#f59e0b" }]}>
            {pendingBills}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Confirming</Text>
          <Text style={[styles.summaryValue, { color: "#2563eb" }]}>
            {confirmingBills}
          </Text>
        </View>
      </View>
      <View style={styles.unpaidRow}>
        <Text style={styles.unpaidLabel}>Unpaid Amount</Text>
        <Text style={styles.unpaidValue}>{unpaidAmount}</Text>
      </View>
      {/* Bills Table */}
      <Text style={styles.sectionTitle}>Bills History</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Filter by status</Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={16}
            color="#64748b"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Month</Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={16}
            color="#64748b"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, { flex: 1.2 }]}>Month</Text>
        <Text style={[styles.tableCell, { flex: 1 }]}>Electricity</Text>
        <Text style={[styles.tableCell, { flex: 1 }]}>Water</Text>
        <Text style={[styles.tableCell, { flex: 1 }]}>Service</Text>
        <Text style={[styles.tableCell, { flex: 1.2 }]}>Total</Text>
        <Text style={[styles.tableCell, { flex: 1 }]}>Status</Text>
        <Text style={[styles.tableCell, { flex: 1 }]}>Image Proof</Text>
        <Text style={[styles.tableCell, { flex: 1 }]}>Actions</Text>
      </View>
      {bills.map((bill) => (
        <View style={styles.tableRow} key={bill.id}>
          <View style={[styles.tableCell, { flex: 1.2 }]}>
            <Text style={styles.boldText}>{bill.month}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text>{bill.electricity}</Text>
            <Text style={styles.subText}>{bill.electricityDetail}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text>{bill.water}</Text>
            <Text style={styles.subText}>{bill.waterDetail}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text>{bill.service}</Text>
            {bill.serviceDetail && (
              <Text style={styles.subText}>{bill.serviceDetail}</Text>
            )}
          </View>
          <View style={[styles.tableCell, { flex: 1.2 }]}>
            <Text style={styles.boldText}>{bill.total}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <Text style={styles.statusText}>{bill.status}</Text>
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            {bill.image ? (
              <Image source={{ uri: bill.image }} style={styles.proofImage} />
            ) : (
              <Text style={styles.subText}>No Image</Text>
            )}
          </View>
          <View style={[styles.tableCell, { flex: 1 }]}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>{bill.actions || "View"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <Text style={styles.paginationText}>1-6 of 6 bills</Text>
      {/* Payment Info */}
      <Text style={styles.sectionTitle}>Payment Information</Text>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle}>Payment Methods:</Text>
        <Text style={styles.paymentText}>
          - Online payment via VNPay, MoMo, ZaloPay
        </Text>
        <Text style={styles.paymentText}>
          - Bank transfer to landlord's account
        </Text>
        <Text style={styles.paymentText}>
          - Cash payment (contact landlord)
        </Text>
        <Text style={styles.paymentNote}>
          Note: Please pay your bills before the due date to avoid late fees.
          Contact your landlord if you have any payment issues.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 2,
  },
  summaryLabel: { fontSize: 13, color: "#64748b", marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  unpaidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  unpaidLabel: { fontSize: 14, color: "#92400e", fontWeight: "600" },
  unpaidValue: { fontSize: 16, color: "#ef4444", fontWeight: "700" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginVertical: 12,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  filterText: { fontSize: 13, color: "#64748b", marginRight: 2 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    alignItems: "center",
    elevation: 1,
  },
  tableCell: { paddingHorizontal: 4 },
  boldText: { fontWeight: "700", color: "#1e293b" },
  subText: { fontSize: 11, color: "#64748b" },
  statusText: { fontSize: 13, fontWeight: "600", color: "#2563eb" },
  proofImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },
  actionButton: {
    backgroundColor: "#2563eb",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  paginationText: { textAlign: "center", color: "#64748b", marginVertical: 10 },
  paymentInfo: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  paymentTitle: { fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  paymentText: { color: "#334155", marginBottom: 2 },
  paymentNote: { color: "#ef4444", marginTop: 8, fontSize: 13 },
});

export default BillsTab;
