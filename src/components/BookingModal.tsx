import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  ScrollView,
} from "react-native";
import { RequestBooking } from "../types/types";

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (booking: RequestBooking) => void;
  roomId: string;
  roomTitle: string;
  pricePerMonth: number;
}

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 12];

const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  onClose,
  onConfirm,
  roomTitle,
  roomId,
  pricePerMonth,
}) => {
  const [duration, setDuration] = useState(1);
  const [tenants, setTenants] = useState(1);
  const today = new Date();
  const startDate = today.toLocaleDateString("vi-VN");
  const endDateObj = new Date(
    today.getFullYear(),
    today.getMonth() + duration,
    today.getDate()
  );
  const endDate = endDateObj.toLocaleDateString("vi-VN");
  const totalCost = duration * pricePerMonth;
  const handleConfirm = () => {
    onConfirm({
      roomId: roomId,
      rentalDate: today.toISOString(),
      rentalExpires: endDateObj.toISOString(),
      tenantCount: tenants,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Book Room</Text>
          <View style={styles.roomInfoBox}>
            <Text style={styles.roomTitle}>{roomTitle}</Text>
            <Text style={styles.roomPrice}>
              {pricePerMonth.toLocaleString("vi-VN")} VND/month
            </Text>
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Rental Period</Text>
            <Text style={styles.periodText}>
              Start Date: <Text style={styles.bold}>{startDate} (Today)</Text>
            </Text>
            <Text style={styles.periodText}>
              End Date: <Text style={styles.bold}>{endDate}</Text>
            </Text>
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Rental Duration (Months)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.durationRow}
            >
              {DURATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.durationOption,
                    duration === opt && styles.durationOptionActive,
                  ]}
                  onPress={() => setDuration(opt)}
                >
                  <Text
                    style={[
                      styles.durationOptionText,
                      duration === opt && styles.durationOptionTextActive,
                    ]}
                  >
                    {opt} Month{opt > 1 ? "s" : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Total Cost</Text>
            <View style={styles.totalCostBox}>
              <Text style={styles.totalCost}>
                {totalCost.toLocaleString("vi-VN")} VND
              </Text>
              <Text style={styles.totalCostDesc}>
                {duration} month{duration > 1 ? "s" : ""} ×
                {pricePerMonth.toLocaleString("vi-VN")} VND/month
              </Text>
            </View>
          </View>

          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Number of Tenants</Text>
            <View style={styles.tenantsRow}>
              <Text style={styles.tenantsIcon}>👤</Text>
              <TextInput
                style={styles.tenantsInput}
                keyboardType="number-pad"
                value={tenants === 0 ? "" : tenants.toString()}
                onChangeText={(v) => {
                  // Nếu input rỗng, set 0 (để value thành '')
                  if (v === "" || v.replace(/[^0-9]/g, "") === "") {
                    setTenants(0);
                  } else {
                    // Loại bỏ số 0 đầu, chỉ nhận số nguyên dương
                    const cleaned = v.replace(/^0+/, "").replace(/[^0-9]/g, "");
                    setTenants(cleaned ? parseInt(cleaned) : 0);
                  }
                }}
                maxLength={2}
                placeholder="1"
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Confirm Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "95%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 8 },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  roomInfoBox: {
    backgroundColor: "#f6fef9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  roomPrice: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 4,
    fontSize: 15,
  },
  periodText: {
    fontSize: 13,
    marginBottom: 2,
  },
  bold: { fontWeight: "bold" },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  durationOption: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  durationOptionActive: {
    backgroundColor: "#2563eb",
  },
  durationOptionText: {
    color: "#222",
    fontWeight: "500",
  },
  durationOptionTextActive: {
    color: "#fff",
  },
  totalCostBox: {
    backgroundColor: "#e0fce6",
    borderRadius: 8,
    padding: 10,
    alignItems: "flex-start",
  },
  totalCost: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: 18,
  },
  totalCostDesc: {
    color: "#16a34a",
    fontSize: 13,
    marginTop: 2,
  },
  tenantsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  tenantsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  tenantsInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 16,
    width: 50,
    textAlign: "center",
    backgroundColor: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#222",
    fontWeight: "600",
    fontSize: 15,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});

export default BookingModal;
