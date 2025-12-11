import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RoomSection from "../../../components/RoomSection";
import SearchBar from "../../../components/SearchBar";
import {
  fetchRoomsSmart,
  fetchRoomsByLocation,
} from "../../../Services/RoomService";
import { getUserPreferences } from "../../../Services/ProfileService";
import {
  geocodeAddress,
  buildAddressString,
} from "../../../Services/AddressService";
import { ListRoom } from "../../../types/types";
import useAuthStore from "../../../Stores/useAuthStore";
import useLocationStore from "../../../Stores/useLocationStore";
import {
  normalize,
  fontSize,
  spacing,
  layout,
  isSmallDevice,
} from "../../../utils/responsive";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../StackNavigator";
interface PaginatedResponse {
  data: ListRoom[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  // Get current user and location from stores
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const userId = currentUser?.id;
  const {
    location,
    isSearching,
    savedPreferences,
    setLocation,
    setSavedPreferences,
  } = useLocationStore();
  const navigation = useNavigation<NavigationProp>();

  // Search state
  const [searchText, setSearchText] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [currentArea, setCurrentArea] = useState("Searching all areas");
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

  // Load user preferences on mount (for logged-in users)
  useEffect(() => {
    const loadUserPreferences = async () => {
      console.log("🔧 [HomeScreen] Loading user preferences, userId:", userId);
      if (userId) {
        try {
          const prefs = await getUserPreferences(userId);
          console.log("📊 [HomeScreen] User preferences loaded:", prefs);
          if (prefs) {
            setSavedPreferences(prefs);
          }
        } catch (error) {
          console.error(
            "❌ [HomeScreen] Error loading user preferences:",
            error
          );
        }
      } else {
        console.log("👤 [HomeScreen] No userId, skipping preferences load");
      }
    };

    loadUserPreferences();
  }, [userId, setSavedPreferences]);

  // Fetch VIP rooms with smart location logic
  const fetchVipRooms = useCallback(
    async (page: number = 0) => {
      console.log("🏠 [VIP] Starting fetch, page:", page);
      console.log("🏠 [VIP] Current state:", {
        userId,
        hasLocation: !!location,
        locationCoords: location
          ? { lat: location.lat, lng: location.lng }
          : null,
        hasSavedPreferences: !!savedPreferences,
        savedCoords:
          savedPreferences?.latitude && savedPreferences?.longitude
            ? {
                lat: savedPreferences.latitude,
                lng: savedPreferences.longitude,
              }
            : null,
      });

      setVipLoading(true);
      try {
        let response;

        // Priority 1: Use explicit location from search
        if (location) {
          console.log("✅ [VIP] Using explicit location from search");
          response = (await fetchRoomsSmart(
            page,
            PAGE_SIZE,
            "VIP",
            userId,
            location.lat,
            location.lng
          )) as unknown as PaginatedResponse;
        }
        // Priority 2: Use saved preferences for logged-in users
        else if (
          userId &&
          savedPreferences?.latitude &&
          savedPreferences?.longitude
        ) {
          console.log("✅ [VIP] Using saved preferences");
          response = (await fetchRoomsSmart(
            page,
            PAGE_SIZE,
            "VIP",
            userId,
            savedPreferences.latitude,
            savedPreferences.longitude
          )) as unknown as PaginatedResponse;
        }
        // Priority 3: Default fetch (user-based for logged-in, general for guests)
        else {
          console.log("✅ [VIP] Using default fetch");
          response = (await fetchRoomsSmart(
            page,
            PAGE_SIZE,
            "VIP",
            userId
          )) as unknown as PaginatedResponse;
        }

        // console.log("📦 [VIP] Response received:", {
        //   hasData: !!response,
        //   dataLength: response?.data?.length || 0,
        //   totalPages: response?.totalPages,
        //   totalRecords: response?.totalRecords,
        //   responseType: typeof response,
        //   isArray: Array.isArray(response),
        //   responseKeys: response ? Object.keys(response) : [],
        //   firstItem: response?.data?.[0] || null,
        // });

        // Handle different response structures
        let rooms: ListRoom[] = [];
        let pages = 1;

        if (response?.data && Array.isArray(response.data)) {
          // Standard paginated response with data property
          rooms = response.data;
          pages = response.totalPages || 1;
        } else if (Array.isArray(response)) {
          // Direct array response
          rooms = response;
          pages = 1;
        } else {
          console.warn("⚠️ [VIP] Unexpected response structure:", response);
        }

        console.log("📦 [VIP] Processed rooms:", {
          roomsCount: rooms.length,
          totalPages: pages,
        });

        setRoomVip(rooms);
        setVipTotalPages(pages);
      } catch (error) {
        console.error("❌ [VIP] Error fetching VIP rooms:", error);
      } finally {
        setVipLoading(false);
      }
    },
    [location, userId, savedPreferences]
  );

  useEffect(() => {
    fetchVipRooms(vipPage);
  }, [vipPage, fetchVipRooms]);

  // Fetch Normal rooms with smart location logic
  const fetchNormalRooms = useCallback(
    async (page: number = 0) => {
      console.log("🏡 [NORMAL] Starting fetch, page:", page);
      console.log("🏡 [NORMAL] Current state:", {
        userId,
        hasLocation: !!location,
        locationCoords: location
          ? { lat: location.lat, lng: location.lng }
          : null,
        hasSavedPreferences: !!savedPreferences,
        savedCoords:
          savedPreferences?.latitude && savedPreferences?.longitude
            ? {
                lat: savedPreferences.latitude,
                lng: savedPreferences.longitude,
              }
            : null,
      });

      setNormalLoading(true);
      try {
        let response;

        // Priority 1: Use explicit location from search
        if (location) {
          console.log("✅ [NORMAL] Using explicit location from search");
          response = (await fetchRoomsSmart(
            page,
            PAGE_SIZE,
            "NORMAL",
            userId,
            location.lat,
            location.lng
          )) as unknown as PaginatedResponse;
        }
        // Priority 2: Use saved preferences for logged-in users
        else if (
          userId &&
          savedPreferences?.latitude &&
          savedPreferences?.longitude
        ) {
          console.log("✅ [NORMAL] Using saved preferences");
          response = (await fetchRoomsSmart(
            page,
            PAGE_SIZE,
            "NORMAL",
            userId,
            savedPreferences.latitude,
            savedPreferences.longitude
          )) as unknown as PaginatedResponse;
        }
        // Priority 3: Default fetch (user-based for logged-in, general for guests)
        else {
          console.log("✅ [NORMAL] Using default fetch");
          response = (await fetchRoomsSmart(
            page,
            PAGE_SIZE,
            "NORMAL",
            userId
          )) as unknown as PaginatedResponse;
        }

        // console.log("📦 [NORMAL] Response received:", {
        //   hasData: !!response,
        //   dataLength: response?.data?.length || 0,
        //   totalPages: response?.totalPages,
        //   totalRecords: response?.totalRecords,
        //   responseType: typeof response,
        //   isArray: Array.isArray(response),
        //   responseKeys: response ? Object.keys(response) : [],
        //   firstItem: response?.data?.[0] || null,
        // });

        // Handle different response structures
        let rooms: ListRoom[] = [];
        let pages = 1;

        if (response?.data && Array.isArray(response.data)) {
          // Standard paginated response with data property
          rooms = response.data;
          pages = response.totalPages || 1;
        } else if (Array.isArray(response)) {
          // Direct array response
          rooms = response;
          pages = 1;
        } else {
          console.warn("⚠️ [NORMAL] Unexpected response structure:", response);
        }

        // console.log("📦 [NORMAL] Processed rooms:", {
        //   roomsCount: rooms.length,
        //   totalPages: pages,
        // });

        setRoomNormal(rooms);
        setNormalTotalPages(pages);
      } catch (error) {
        console.error("❌ [NORMAL] Error fetching Normal rooms:", error);
      } finally {
        setNormalLoading(false);
      }
    },
    [location, userId, savedPreferences]
  );

  useEffect(() => {
    fetchNormalRooms(normalPage);
  }, [normalPage, fetchNormalRooms]);

  const handleSearch = async () => {
    console.log("🔍 [handleSearch] Searching with:", {
      searchText,
      selectedProvince,
      selectedDistrict,
      selectedWard,
    });

    // Build the full address string
    const addressToSearch = buildAddressString(
      searchText,
      selectedWard,
      selectedDistrict,
      selectedProvince
    );

    if (!addressToSearch.trim()) {
      console.warn("⚠️ [handleSearch] No address provided");
      return;
    }

    try {
      // Geocode the address to get coordinates
      const geoResult = await geocodeAddress(addressToSearch);

      if (!geoResult) {
        console.error("❌ [handleSearch] Failed to geocode address");
        // TODO: Show error message to user
        return;
      }

      console.log("✅ [handleSearch] Geocoded successfully:", geoResult);

      // Update location in store
      setLocation({
        lat: geoResult.lat,
        lng: geoResult.lng,
        address: geoResult.formattedAddress,
      });

      // Update current area display
      setCurrentArea(geoResult.formattedAddress);

      // Fetch rooms by location
      const roomsData = await fetchRoomsByLocation(
        geoResult.lat,
        geoResult.lng,
        geoResult.formattedAddress,
        userId
      );

      if (roomsData) {
        console.log("✅ [handleSearch] Rooms fetched successfully:", {
          totalRooms: roomsData.totalRooms,
        });

        // Update VIP rooms
        const vipData = Array.isArray(roomsData.vipRooms)
          ? roomsData.vipRooms
          : roomsData.vipRooms?.data || [];
        setRoomVip(vipData);
        setVipTotalPages(roomsData.vipRooms?.totalPages || 1);

        // Update Normal rooms
        const normalData = Array.isArray(roomsData.normalRooms)
          ? roomsData.normalRooms
          : roomsData.normalRooms?.data || [];
        setRoomNormal(normalData);
        setNormalTotalPages(roomsData.normalRooms?.totalPages || 1);

        // Reset to first page
        setVipPage(0);
        setNormalPage(0);

        // TODO: Show success message to user
        console.log(
          `🎯 Found ${roomsData.totalRooms} rooms near "${geoResult.formattedAddress}"`
        );
      }
    } catch (error) {
      console.error("❌ [handleSearch] Error searching rooms:", error);
      // TODO: Show error message to user
    }
  };

  const handleRoomPress = (roomId: string) => {
    console.log("Room pressed:", roomId);
    navigation.navigate("RoomDetailScreen", { roomId });
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
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

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
          currentArea={currentArea}
          onCurrentAreaChange={setCurrentArea}
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
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
    paddingTop: normalize(20),
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: normalize(20),
    borderBottomRightRadius: normalize(20),
    shadowColor: "#3B82F6",
    shadowOpacity: 0.08,
    shadowRadius: normalize(6),
    shadowOffset: { width: 0, height: normalize(3) },
    elevation: 4,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: fontSize.base,
    color: "#6B7280",
    marginBottom: spacing.xs,
    fontWeight: "500",
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#1A1A2E",
    letterSpacing: 0.2,
  },
  logoutButton: {
    padding: spacing.md,
    borderRadius: normalize(10),
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: isSmallDevice ? normalize(100) : normalize(120),
  },
  title: {
    fontSize: isSmallDevice ? fontSize["2xl"] : fontSize["3xl"],
    fontWeight: "800",
    marginBottom: spacing.md,
    marginTop: spacing["2xl"],
    color: "#1A1A2E",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: "#6B7280",
    fontWeight: "500",
  },
  userInfo: {
    marginTop: spacing["2xl"],
    alignItems: "center",
  },
  userEmail: {
    fontSize: fontSize.md,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});

export default HomeScreen;
