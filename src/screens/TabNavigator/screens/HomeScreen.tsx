import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RoomSection from "../../../components/RoomSection";
import SearchBar from "../../../components/SearchBar";
import { fetchRoomNormal, fetchRoomVip } from "../../../Services/RoomService";
import { ListRoom } from "../../../types/types";

interface PaginatedResponse {
  data: ListRoom[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const HomeScreen: React.FC = () => {
  // Search state
  const [searchText, setSearchText] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [favoriteRoomIds, setFavoriteRoomIds] = useState<string[]>([]);
  const [roomVip, setRoomVip] = useState<ListRoom[]>([]);
  const [roomNormal, setRoomNormal] = useState<ListRoom[]>([]);

  // Pagination state for VIP rooms
  const [vipPage, setVipPage] = useState(0);
  const [vipTotalPages, setVipTotalPages] = useState(1);
  const [vipLoading, setVipLoading] = useState(false);

  // Pagination state for Normal rooms
  const [normalPage, setNormalPage] = useState(0);
  const [normalTotalPages, setNormalTotalPages] = useState(1);
  const [normalLoading, setNormalLoading] = useState(false);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  const PAGE_SIZE = 6;

  // Fetch VIP rooms with pagination
  const fetchVipRooms = async (page: number = 0) => {
    setVipLoading(true);
    try {
      const response = (await fetchRoomVip(
        page,
        PAGE_SIZE
      )) as unknown as PaginatedResponse;
      setRoomVip(response.data);
      setVipTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Error fetching VIP rooms:", error);
    } finally {
      setVipLoading(false);
    }
  };

  useEffect(() => {
    fetchVipRooms(vipPage);
  }, [vipPage]);

  // Fetch Normal rooms with pagination
  const fetchNormalRooms = async (page: number = 0) => {
    setNormalLoading(true);
    try {
      const response = (await fetchRoomNormal(
        page,
        PAGE_SIZE
      )) as unknown as PaginatedResponse;
      setRoomNormal(response.data);
      setNormalTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Error fetching Normal rooms:", error);
    } finally {
      setNormalLoading(false);
    }
  };

  useEffect(() => {
    fetchNormalRooms(normalPage);
  }, [normalPage]);

  const handleSearch = () => {
    console.log("Searching with:", {
      searchText,
      selectedProvince,
      selectedDistrict,
      selectedWard,
    });
  };

  const handleRoomPress = (roomId: string) => {
    console.log("Room pressed:", roomId);
    // Navigate to room detail screen
  };

  const handleFavorite = (roomId: string) => {
    setFavoriteRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  // VIP rooms pagination handlers
  const handleVipPrevPage = () => {
    if (vipPage > 0) {
      setVipPage(vipPage - 1);
    }
  };

  const handleVipNextPage = () => {
    if (vipPage < vipTotalPages - 1) {
      setVipPage(vipPage + 1);
    }
  };

  // Normal rooms pagination handlers
  const handleNormalPrevPage = () => {
    if (normalPage > 0) {
      setNormalPage(normalPage - 1);
    }
  };

  const handleNormalNextPage = () => {
    if (normalPage < normalTotalPages - 1) {
      setNormalPage(normalPage + 1);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reset to first page for both sections
      setVipPage(0);
      setNormalPage(0);

      // Fetch fresh data for both sections
      await Promise.all([fetchVipRooms(0), fetchNormalRooms(0)]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />

      {/* Header */}
      {/* <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          {user && (
            <Text style={styles.userName}>{user.userProfile.fullName}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await useAuthStore.getState().logOut();
            navigation.navigate("LoginScreen");
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View> */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]} // Android
            tintColor={"#007AFF"} // iOS
          />
        }
      >
        {/* Search Bar */}
        <SearchBar
          searchText={searchText}
          onSearchChange={setSearchText}
          selectedProvince={selectedProvince}
          selectedDistrict={selectedDistrict}
          selectedWard={selectedWard}
          onProvinceChange={setSelectedProvince}
          onDistrictChange={setSelectedDistrict}
          onWardChange={setSelectedWard}
          onSearch={handleSearch}
        />

        {/* Premium Listings Section */}
        <RoomSection
          title="Premium Listings"
          subtitle="Hand-picked premium rooms for the discerning renter"
          icon="star"
          rooms={roomVip}
          onViewAll={() => console.log("View all VIP rooms")}
          onRoomPress={handleRoomPress}
          onFavorite={handleFavorite}
          favoriteRoomIds={favoriteRoomIds}
          currentPage={vipPage}
          totalPages={vipTotalPages}
          onPrevPage={handleVipPrevPage}
          onNextPage={handleVipNextPage}
          loading={vipLoading}
        />

        {/* Featured Properties Section */}
        <RoomSection
          title="Featured Properties"
          subtitle="Discover our most popular and highly-rated rental properties"
          icon="home"
          rooms={roomNormal}
          onViewAll={() => console.log("View all featured rooms")}
          onRoomPress={handleRoomPress}
          onFavorite={handleFavorite}
          favoriteRoomIds={favoriteRoomIds}
          currentPage={normalPage}
          totalPages={normalTotalPages}
          onPrevPage={handleNormalPrevPage}
          onNextPage={handleNormalNextPage}
          loading={normalLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add bottom padding to avoid tab bar overlap
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  userInfo: {
    marginTop: 20,
    alignItems: "center",
  },
  userEmail: {
    fontSize: 16,
    color: "#888",
  },
});

export default HomeScreen;
