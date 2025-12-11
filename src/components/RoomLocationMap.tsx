import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
} from "react-native";
import Mapbox, { Camera, MapView, MarkerView } from "@rnmapbox/maps";
import { Ionicons } from "@expo/vector-icons";
import { MAPBOX_ACCESS_TOKEN } from "@env";

// Configure Mapbox
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

interface Address {
  id?: string;
  street: string;
  ward?: {
    id?: number;
    name: string;
    district?: {
      id?: number;
      name: string;
      province?: {
        id?: number;
        name: string;
      };
    };
  };
}

interface RoomLocationMapProps {
  address?: Address;
  roomTitle?: string;
  roomPrice?: number;
}

const RoomLocationMap: React.FC<RoomLocationMapProps> = ({
  address,
  roomTitle,
  roomPrice,
}) => {
  const cameraRef = useRef<Camera>(null);
  const [coordinates, setCoordinates] = useState({
    lat: 16.0471,
    lng: 108.2068,
  });
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Goong Maps Geocoding function
  const geocodeAddressWithGoong = async (address: string) => {
    setIsGeocodingLoading(true);
    try {
      const GOONG_API_KEY = process.env.GOONG_API_KEY;

      if (!GOONG_API_KEY) {
        console.log("⚠️ GOONG_API_KEY not found, using default coordinates");
        return;
      }

      const response = await fetch(
        `https://rsapi.goong.io/geocode?address=${encodeURIComponent(
          address
        )}&api_key=${GOONG_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const lat = location.lat;
        const lng = location.lng;
        setCoordinates({ lat, lng });
        console.log(
          "✅ Goong geocoded coordinates for:",
          address,
          "→",
          lat,
          lng
        );
      } else {
        console.log("❌ No Goong coordinates found for address:", address);
        // Fallback to OpenStreetMap Nominatim
        await fallbackGeocode(address);
      }
    } catch (error) {
      console.log("🔥 Goong geocoding error:", error);
      // Fallback to OpenStreetMap Nominatim
      await fallbackGeocode(address);
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  // Fallback geocoding using OpenStreetMap Nominatim
  const fallbackGeocode = async (address: string) => {
    try {
      console.log("🔄 Falling back to OpenStreetMap Nominatim...");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=1&countrycodes=VN`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCoordinates({ lat, lng });
        console.log(
          "✅ Fallback geocoded coordinates for:",
          address,
          "→",
          lat,
          lng
        );
      }
    } catch (error) {
      console.log("🔥 Fallback geocoding error:", error);
    }
  };

  useEffect(() => {
    if (address) {
      const fullAddress = `${address.street}, ${address.ward?.name}, ${address.ward?.district?.name}, ${address.ward?.district?.province?.name}`;
      geocodeAddressWithGoong(fullAddress);
    }
  }, [address]);

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
    Linking.openURL(url);
  };

  const displayAddress = address
    ? `${address.street}, ${address.ward?.name}, ${address.ward?.district?.name}, ${address.ward?.district?.province?.name}`
    : "Address not available";

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="location-outline" size={24} color="#4f46e5" />
        <Text style={styles.sectionTitle}>Location</Text>
      </View>

      {/* Address Display */}
      <View style={styles.addressContainer}>
        <Text style={styles.mapAddress}>{displayAddress}</Text>
      </View>

      {/* Map Display */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          styleURL="mapbox://styles/mapbox/streets-v12"
          pitchEnabled={false}
          rotateEnabled={false}
          scrollEnabled={true}
          zoomEnabled={true}
        >
          <Camera
            ref={cameraRef}
            centerCoordinate={[coordinates.lng, coordinates.lat]}
            zoomLevel={15}
            animationMode="flyTo"
            animationDuration={1000}
          />

          <MarkerView
            coordinate={[coordinates.lng, coordinates.lat]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require("../../assets/red_position_ants.png")}
                style={styles.markerImage}
                resizeMode="contain"
              />
            </View>
          </MarkerView>
        </MapView>

        {/* Geocoding Loading Overlay */}
        {isGeocodingLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <Ionicons name="location-outline" size={20} color="#4f46e5" />
              <Text style={styles.loadingText}>Finding location...</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.mapButton} onPress={handleOpenGoogleMaps}>
        <Ionicons name="open-outline" size={18} color="#4f46e5" />
        <Text style={styles.mapButtonText}>Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  addressContainer: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#4f46e5",
  },
  mapAddress: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerImage: {
    width: 40,
    height: 36,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "500",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#4f46e5",
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4f46e5",
  },
});

export default RoomLocationMap;
