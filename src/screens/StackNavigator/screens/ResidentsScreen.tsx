import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

interface Resident {
  id: string;
  name: string;
  roomName: string;
  phoneNumber: string;
  email: string;
  moveInDate: string;
  relationship: "owner" | "tenant" | "roommate";
  isActive: boolean;
}

const ResidentsScreen = ({ navigation }: Props) => {
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadResidents();
  }, []);

  const loadResidents = async () => {
    setLoading(true);
    try {
      setResidents([
        {
          id: "1",
          name: "Nguyễn Văn A",
          roomName: "Phòng 101",
          phoneNumber: "0123456789",
          email: "nguyenvana@email.com",
          moveInDate: "2024-01-01",
          relationship: "owner",
          isActive: true,
        },
        {
          id: "2",
          name: "Trần Thị B",
          roomName: "Phòng 101",
          phoneNumber: "0987654321",
          email: "tranthib@email.com",
          moveInDate: "2024-01-01",
          relationship: "roommate",
          isActive: true,
        },
        {
          id: "3",
          name: "Lê Văn C",
          roomName: "Phòng 205",
          phoneNumber: "0369852147",
          email: "levanc@email.com",
          moveInDate: "2023-06-15",
          relationship: "tenant",
          isActive: false,
        },
      ]);
    } catch (error) {
      console.error("Error loading residents:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load residents",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case "owner":
        return "#9C27B0";
      case "tenant":
        return "#2196F3";
      case "roommate":
        return "#4CAF50";
      default:
        return "#999";
    }
  };

  const getRelationshipText = (relationship: string) => {
    switch (relationship) {
      case "owner":
        return "Owner";
      case "tenant":
        return "Tenant";
      case "roommate":
        return "Roommate";
      default:
        return relationship;
    }
  };

  const filteredResidents = residents.filter(
    (resident) =>
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.phoneNumber.includes(searchQuery)
  );

  const renderResident = (resident: Resident) => (
    <TouchableOpacity
      key={resident.id}
      style={[
        styles.residentCard,
        !resident.isActive && styles.residentCardInactive,
      ]}
      onPress={() => {
        // Navigate to resident details or start chat
        console.log("View resident:", resident.id);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.residentHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{resident.name.charAt(0)}</Text>
          </View>
          {resident.isActive && <View style={styles.activeDot} />}
        </View>

        <View style={styles.residentInfo}>
          <Text style={styles.residentName}>{resident.name}</Text>
          <View style={styles.residentMetaRow}>
            <View
              style={[
                styles.relationshipBadge,
                {
                  backgroundColor:
                    getRelationshipColor(resident.relationship) + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.relationshipText,
                  { color: getRelationshipColor(resident.relationship) },
                ]}
              >
                {getRelationshipText(resident.relationship)}
              </Text>
            </View>
            <Text style={styles.roomName}>{resident.roomName}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            // Start chat with resident
            console.log("Chat with:", resident.id);
          }}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <View style={styles.residentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={14} color="#666" />
          <Text style={styles.detailText}>{resident.phoneNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="mail" size={14} color="#666" />
          <Text style={styles.detailText}>{resident.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={14} color="#666" />
          <Text style={styles.detailText}>Moved in: {resident.moveInDate}</Text>
        </View>
      </View>

      {!resident.isActive && (
        <View style={styles.inactiveBanner}>
          <Ionicons name="information-circle" size={16} color="#FF9800" />
          <Text style={styles.inactiveBannerText}>Moved out</Text>
        </View>
      )}
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
        <Text style={styles.headerTitle}>Residents</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, room, or phone"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading residents...</Text>
          </View>
        ) : filteredResidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No residents found" : "No residents"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try a different search term"
                : "Your roommates will appear here"}
            </Text>
          </View>
        ) : (
          <View style={styles.residentsList}>
            <Text style={styles.sectionTitle}>
              {filteredResidents.length} Resident
              {filteredResidents.length !== 1 ? "s" : ""}
            </Text>
            {filteredResidents.map(renderResident)}
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
  searchContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: normalize(10),
    paddingHorizontal: spacing.md,
    height: normalize(44),
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: "#333",
  },
  content: {
    flex: 1,
  },
  residentsList: {
    padding: layout.screenPadding,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: "#999",
    fontWeight: "600",
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  residentCard: {
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
  residentCardInactive: {
    opacity: 0.7,
  },
  residentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSize.lg,
    color: "#fff",
    fontWeight: "600",
  },
  activeDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  residentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  residentName: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: "#333",
    marginBottom: spacing.xs,
  },
  residentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  relationshipBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: normalize(8),
  },
  relationshipText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  roomName: {
    fontSize: fontSize.sm,
    color: "#666",
  },
  chatButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2FF",
    borderRadius: normalize(20),
  },
  residentDetails: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: "#666",
  },
  inactiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: "#FFF8E1",
    borderRadius: normalize(8),
  },
  inactiveBannerText: {
    fontSize: fontSize.xs,
    color: "#FF9800",
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

export default ResidentsScreen;
