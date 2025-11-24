import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import FilePreview from "../../../components/FilePreview";
import BillsTab from "../../../components/BillsTab";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ContractDetail,
  LandlordPaymentInfo,
  TenantInfo,
} from "../../../types/types";
import { fetchContractDetail } from "../../../Services/ContractService";
import { URL_IMAGE } from "../../../Services/Constants";
type ContractOverviewScreenRouteParams = {
  contractId: string;
  initialTab?: "overview" | "bills"; // optional
};
type Props = {
  navigation: any;
  route: { params: ContractOverviewScreenRouteParams };
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const ContractOverviewScreen = ({ navigation, route }: Props) => {
  const contractId = route.params.contractId;
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"overview" | "bills">("overview");
  const [contractData, setContractData] = useState<ContractDetail>();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>();
  const [infoLandlord, setInfoLandlord] = useState<LandlordPaymentInfo>();
  const initialTab = route.params.initialTab;
  console.log("initialTab:", initialTab); // phải in ra 'bills'
  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetchContractDetail(contractId);
        const tenantInfo = {
          name: response.tenantName,
          phone: response.tenantPhone,
          roomTitle: response.roomTitle,
        } as TenantInfo;
        const landlordInfo = {
          bankNumber: response.landlordPaymentInfo.bankNumber,
          binCode: response.landlordPaymentInfo.binCode,
          bankName: response.landlordPaymentInfo.bankName,
          accountHolderName: response.landlordPaymentInfo.accountHolderName,
          phoneNumber: response.landlordPaymentInfo.phoneNumber,
        } as LandlordPaymentInfo;
        setTenantInfo(tenantInfo);
        setInfoLandlord(landlordInfo);
        setContractData(response);
      } catch (error) {
        console.error("Error fetching contract detail:", error);
      }
    };

    fetchContract();
  }, [contractId]);

  const formatCurrencyVN = (value?: number | string) => {
    if (value === undefined || value === null) return "";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return value + " ₫";
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const InfoCard = ({ icon, label, value, valueColor }: any) => (
    <View style={styles.infoCard}>
      <View style={styles.infoCardIcon}>
        <MaterialCommunityIcons name={icon} size={20} color="#6366f1" />
      </View>
      <View style={styles.infoCardContent}>
        <Text style={styles.infoCardLabel}>{label}</Text>
        <Text
          style={[styles.infoCardValue, valueColor && { color: valueColor }]}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contract</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, tab === "overview" && styles.tabActive]}
            onPress={() => setTab("overview")}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={18}
              color={tab === "overview" ? "#fff" : "#64748b"}
            />
            <Text
              style={[
                styles.tabText,
                tab === "overview" && styles.tabTextActive,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "bills" && styles.tabActive]}
            onPress={() => setTab("bills")}
          >
            <MaterialCommunityIcons
              name="receipt"
              size={18}
              color={tab === "bills" ? "#fff" : "#64748b"}
            />
            <Text
              style={[styles.tabText, tab === "bills" && styles.tabTextActive]}
            >
              Bills
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {tab === "overview" ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Contract Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusIconContainer}>
                <MaterialCommunityIcons
                  name="file-sign"
                  size={28}
                  color="#fff"
                />
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.contractName} numberOfLines={2}>
                  {contractData?.contractName}
                </Text>
                {contractData?.status == 0 && (
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                )}
                {contractData?.status == 2 && (
                  <View style={styles.statusBadgeExpired}>
                    <View style={styles.statusDotExpired} />
                    <Text style={styles.statusTextExpired}>Expired</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusFooter}>
              <View style={styles.statusFooterItem}>
                <Text style={styles.statusFooterLabel}>Start Date</Text>
                <Text style={styles.statusFooterValue}>
                  {formatDate(contractData?.startDate)}
                </Text>
              </View>
              <View style={styles.statusFooterDivider} />
              <View style={styles.statusFooterItem}>
                <Text style={styles.statusFooterLabel}>End Date</Text>
                <Text style={styles.statusFooterValue}>
                  {formatDate(contractData?.endDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Room Info */}
          <Text style={styles.sectionTitle}>Room Information</Text>
          <View style={styles.roomCard}>
            <MaterialCommunityIcons
              name="home-outline"
              size={22}
              color="#6366f1"
            />
            <Text style={styles.roomText}>{contractData?.roomTitle}</Text>
          </View>

          {/* Details Grid */}
          <Text style={styles.sectionTitle}>Contract Details</Text>
          <View style={styles.infoGrid}>
            <InfoCard
              icon="account-outline"
              label="Tenant"
              value={contractData?.tenantName}
            />
            <InfoCard
              icon="phone-outline"
              label="Phone Number"
              value={contractData?.tenantPhone || "N/A"}
            />
            <InfoCard
              icon="account-tie-outline"
              label="Landlord"
              value={contractData?.landlordName}
            />
            <InfoCard
              icon="cash-multiple"
              label="Deposit Amount"
              value={formatCurrencyVN(contractData?.depositAmount)}
            />
            <InfoCard
              icon="calendar-month-outline"
              label="Monthly Rent"
              value={formatCurrencyVN(contractData?.monthlyRent)}
              valueColor="#22c55e"
            />
            {contractData?.status == 0 && (
              <InfoCard
                icon="check-circle-outline"
                label="Status"
                value="Active"
                valueColor="#22c55e"
              />
            )}
            {contractData?.status == 2 && (
              <InfoCard
                icon="check-circle-outline"
                label="Status"
                value="Expired"
                valueColor="#ef4444"
              />
            )}
          </View>

          {/* Contract File */}
          <Text style={styles.sectionTitle}>Contract File</Text>
          <FilePreview
            fileUrl={
              contractData?.contractImage
                ? URL_IMAGE + contractData.contractImage
                : ""
            }
            fileName={
              contractData?.contractImage
                ? decodeURIComponent(
                    contractData.contractImage.split("/").pop() || "file"
                  )
                : "No file available"
            }
            fileId={contractData?.contractImage}
          />

          {/* Important Notes */}
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={22}
                color="#f59e0b"
              />
              <Text style={styles.notesTitle}>Important Notes</Text>
            </View>
            <View style={styles.notesList}>
              <View style={styles.noteItem}>
                <View style={styles.noteDot} />
                <Text style={styles.noteText}>
                  Update contract information when changes occur
                </Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.noteDot} />
                <Text style={styles.noteText}>
                  Contact landlord if adjustments are needed
                </Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.noteDot} />
                <Text style={styles.noteText}>Pay bills on time</Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.noteDot} />
                <Text style={styles.noteText}>Report issues promptly</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <BillsTab
          contractId={contractId}
          tenantInfo={tenantInfo!}
          infoLandlord={infoLandlord!}
          navigation={navigation}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#2563eb",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  statusInfo: {
    flex: 1,
    marginLeft: 14,
  },
  contractName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22c55e",
  },
  statusDotExpired: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
    marginRight: 6,
  },
  statusTextExpired: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
  },
  statusBadgeExpired: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 14,
  },
  statusFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusFooterItem: {
    flex: 1,
    alignItems: "center",
  },
  statusFooterDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e2e8f0",
  },
  statusFooterLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  statusFooterValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roomText: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
    marginLeft: 12,
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 12,
  },
  infoCard: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  infoCardIcon: {
    position: "absolute",
    top: 12,
    right: 18,
    opacity: 0.3,
  },
  infoCardContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoCardLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  fileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  fileId: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  notesCard: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f59e0b",
    marginLeft: 8,
  },
  notesList: {},
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  noteDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#f59e0b",
    marginTop: 6,
    marginRight: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});

export default ContractOverviewScreen;
