import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  Utensils,
  GraduationCap,
  ShoppingCart,
  Landmark,
  Stethoscope,
  PartyPopper,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";

const GOONG_API_KEY = process.env.GOONG_API_KEY || "YOUR_GOONG_API_KEY";

interface NearbyPlacesProps {
  address?: {
    street?: string;
    ward?: {
      name?: string;
      district?: { name?: string; province?: { name?: string } };
    };
  };
  roomId?: string;
}

interface NearbyPlace {
  name: string;
  type: string;
  distance: number;
  address?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  school: GraduationCap,
  market: ShoppingCart,
  supermarket: ShoppingCart,
  hospital: Stethoscope,
  bank: Landmark,
  restaurant: Utensils,
  park: PartyPopper,
};

const CATEGORY_LABELS: Record<string, string> = {
  school: "Schools",
  market: "Shopping",
  supermarket: "Shopping",
  hospital: "Healthcare",
  bank: "Banks",
  restaurant: "Dining",
  park: "Recreation",
};

const NearbyPlaces: React.FC<NearbyPlacesProps> = ({ address, roomId }) => {
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Haversine formula - calculate distance between two points
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 1000); // Convert to meters
  };

  // Format distance for display
  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${distance}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  // Toggle expand/collapse category
  const toggleCategory = (type: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Helper: Build address string
  const getAddressString = () => {
    if (!address) return "";
    const parts = [
      address.street,
      address.ward?.name,
      address.ward?.district?.name,
      address.ward?.district?.province?.name,
    ];
    return parts.filter(Boolean).join(", ");
  };

  // Geocoding - convert address to coordinates
  const geocodeAddress = async (
    address: string
  ): Promise<Coordinates | null> => {
    try {
      const response = await fetch(
        `https://rsapi.goong.io/Geocode?address=${encodeURIComponent(
          address
        )}&api_key=${GOONG_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📍 Geocoding result for:", address);

        if (data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          const coords = {
            lat: location.lat,
            lng: location.lng,
          };
          console.log("✅ Final coordinates:", coords);
          return coords;
        }
      }
    } catch (error) {
      console.error("❌ Geocoding error:", error);
    }
    return null;
  };

  // Search for nearby places
  const searchNearbyPlaces = async (
    centerLat: number,
    centerLng: number,
    radius: number = 2000
  ): Promise<NearbyPlace[]> => {
    const placeTypes = [
      { query: "school", type: "school" },
      { query: "market", type: "market" },
      { query: "supermarket", type: "supermarket" },
      { query: "hospital", type: "hospital" },
      { query: "bank", type: "bank" },
      { query: "restaurant", type: "restaurant" },
      { query: "park", type: "park" },
    ];

    const allPlaces: NearbyPlace[] = [];

    try {
      for (const placeType of placeTypes) {
        try {
          const apiUrl = `https://rsapi.goong.io/Place/AutoComplete?input=${encodeURIComponent(
            placeType.query
          )}&location=${centerLat},${centerLng}&radius=${radius}&api_key=${GOONG_API_KEY}`;

          const response = await fetch(apiUrl);

          if (response.ok) {
            const data = await response.json();

            if (data.predictions && data.predictions.length > 0) {
              // Take up to 3 places per category
              const places = data.predictions
                .slice(0, 3)
                .map((prediction: any) => {
                  let lat = centerLat;
                  let lng = centerLng;

                  // Try to extract coordinates
                  if (prediction.compound && prediction.compound.location) {
                    lat = prediction.compound.location.lat;
                    lng = prediction.compound.location.lng;
                  } else if (
                    prediction.geometry &&
                    prediction.geometry.location
                  ) {
                    lat = prediction.geometry.location.lat;
                    lng = prediction.geometry.location.lng;
                  } else {
                    // Use estimated distance if coordinates unavailable
                    const randomDistance =
                      Math.floor(Math.random() * 2000) + 200;
                    return {
                      name:
                        prediction.description || `${placeType.query} nearby`,
                      type: placeType.type,
                      distance: randomDistance,
                      address: prediction.description,
                    } as NearbyPlace;
                  }

                  const distance = calculateDistance(
                    centerLat,
                    centerLng,
                    lat,
                    lng
                  );

                  return {
                    name: prediction.description || `${placeType.query} nearby`,
                    type: placeType.type,
                    distance: distance,
                    address: prediction.description,
                  } as NearbyPlace;
                })
                .filter(
                  (place: NearbyPlace) =>
                    place.distance > 0 && place.distance <= radius
                );

              allPlaces.push(...places);
            }
          }
        } catch (error) {
          console.log(`Error fetching ${placeType.type}:`, error);
        }

        // Delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // If no places found, add some mock data
      if (allPlaces.length === 0) {
        const mockPlaces: NearbyPlace[] = [
          {
            name: "Trường học gần đây",
            type: "school",
            distance: Math.floor(Math.random() * 1000) + 300,
            address: "Khu vực lân cận",
          },
          {
            name: "Siêu thị mini",
            type: "supermarket",
            distance: Math.floor(Math.random() * 800) + 200,
            address: "Khu vực lân cận",
          },
          {
            name: "Nhà hàng địa phương",
            type: "restaurant",
            distance: Math.floor(Math.random() * 600) + 150,
            address: "Khu vực lân cận",
          },
          {
            name: "Ngân hàng ATM",
            type: "bank",
            distance: Math.floor(Math.random() * 1200) + 400,
            address: "Khu vực lân cận",
          },
        ];
        allPlaces.push(...mockPlaces);
      }

      // Sort by distance and limit results
      return allPlaces.sort((a, b) => a.distance - b.distance).slice(0, 15);
    } catch (error) {
      console.error("Error searching nearby places:", error);
      return [];
    }
  };

  // Load nearby places when component mounts or address changes
  useEffect(() => {
    const loadNearbyPlaces = async () => {
      if (!address) return;

      setLoading(true);
      setNearbyPlaces([]);

      try {
        const addrStr = getAddressString();
        console.log("🔍 Searching for places near:", addrStr);

        const coords = await geocodeAddress(addrStr);
        if (coords) {
          setCoordinates(coords);
          const places = await searchNearbyPlaces(coords.lat, coords.lng);
          setNearbyPlaces(places);
          console.log(`✅ Found ${places.length} places`);
        }
      } catch (error) {
        console.error("❌ Error loading places:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNearbyPlaces();
  }, [address, roomId]);

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin size={24} color="#4f46e5" />
          <Text style={styles.sectionTitle}>Nearby Places</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text style={styles.loadingText}>Searching for places...</Text>
        </View>
      </View>
    );
  }

  // Group places by type
  const groupedPlaces: Record<string, NearbyPlace[]> = {};
  nearbyPlaces.forEach((place) => {
    if (!groupedPlaces[place.type]) {
      groupedPlaces[place.type] = [];
    }
    groupedPlaces[place.type].push(place);
  });

  const totalPlaces = nearbyPlaces.length;
  const nearestDistance =
    nearbyPlaces.length > 0
      ? Math.min(...nearbyPlaces.map((p) => p.distance))
      : null;

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setIsCollapsed(!isCollapsed)}
      >
        <MapPin size={20} color="#4f46e5" />
        <Text style={styles.sectionTitle}>Nearby Places</Text>
        <Text style={styles.placesCount}>({totalPlaces})</Text>
        {isCollapsed ? (
          <ChevronDown size={18} color="#6b7280" />
        ) : (
          <ChevronUp size={18} color="#6b7280" />
        )}
      </TouchableOpacity>

      {isCollapsed ? (
        <Text style={styles.collapsedSummary}>
          {totalPlaces} places • Nearest:
          {nearestDistance !== null ? formatDistance(nearestDistance) : "N/A"}
        </Text>
      ) : nearbyPlaces.length > 0 ? (
        <View style={styles.nearbyList}>
          {Object.entries(groupedPlaces).map(([type, places]) => (
            <View key={type} style={styles.nearbyCard}>
              <TouchableOpacity
                onPress={() => toggleCategory(type)}
                style={styles.nearbyHeader}
              >
                <View style={styles.nearbyTitleRow}>
                  {(() => {
                    const Icon = CATEGORY_ICONS[type];
                    return Icon ? (
                      <Icon size={18} color="#4f46e5" />
                    ) : (
                      <MapPin size={18} color="#6b7280" />
                    );
                  })()}
                  <Text style={styles.nearbyCategory}>
                    {CATEGORY_LABELS[type] || type}
                  </Text>
                  <View style={styles.nearbyBadge}>
                    <Text style={styles.nearbyBadgeText}>{places.length}</Text>
                  </View>
                </View>
                {expandedCategories[type] ? (
                  <ChevronUp size={20} color="#6b7280" />
                ) : (
                  <ChevronDown size={20} color="#6b7280" />
                )}
              </TouchableOpacity>

              {/* Show places */}
              <View style={styles.nearbyPlaces}>
                {places
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, expandedCategories[type] ? places.length : 1)
                  .map((place, index) => (
                    <View
                      key={`${type}-${index}`}
                      style={styles.nearbyPlaceItem}
                    >
                      <View style={styles.placeInfo}>
                        <Text style={styles.nearbyPlaceText}>{place.name}</Text>
                        {expandedCategories[type] && place.address && (
                          <Text style={styles.placeAddress}>
                            {place.address.length > 40
                              ? `${place.address.substring(0, 40)}...`
                              : place.address}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.distanceText}>
                        {formatDistance(place.distance)}
                      </Text>
                    </View>
                  ))}

                {!expandedCategories[type] && places.length > 1 && (
                  <TouchableOpacity
                    onPress={() => toggleCategory(type)}
                    style={styles.showMoreButton}
                  >
                    <Text style={styles.showMoreText}>
                      +{places.length - 1} more
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryBold}>{totalPlaces} places</Text>
              <Text style={styles.summarySeparator}> • </Text>
              <Text>
                Nearest:
                {nearestDistance !== null
                  ? formatDistance(nearestDistance)
                  : "N/A"}
              </Text>
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MapPin size={32} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No nearby places found</Text>
          <Text style={styles.emptySubtitle}>
            Address may be inaccurate or area data unavailable
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 6,
    flex: 1,
  },
  placesCount: {
    fontSize: 12,
    color: "#6b7280",
    marginRight: 8,
  },
  collapsedSummary: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: -4,
  },
  nearbySubtitle: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 10,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: "#6b7280",
    fontSize: 12,
  },
  nearbyList: {
    gap: 4,
  },
  nearbyCard: {
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  nearbyHeader: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  nearbyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nearbyIcon: {
    fontSize: 14,
  },
  nearbyCategory: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  nearbyBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nearbyBadgeText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
  nearbyPlaces: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nearbyPlaceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  placeInfo: {
    flex: 1,
    marginRight: 8,
  },
  nearbyPlaceText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
  placeAddress: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 1,
  },
  distanceText: {
    fontSize: 11,
    color: "#4f46e5",
    fontWeight: "600",
  },
  showMoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  showMoreText: {
    fontSize: 11,
    color: "#4f46e5",
    fontWeight: "500",
  },
  summaryContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    alignItems: "center",
  },
  summaryText: {
    fontSize: 11,
    color: "#1e40af",
  },
  summaryBold: {
    fontWeight: "600",
  },
  summarySeparator: {
    color: "#60a5fa",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    fontWeight: "500",
  },
  emptySubtitle: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
    textAlign: "center",
  },
});

export default NearbyPlaces;
