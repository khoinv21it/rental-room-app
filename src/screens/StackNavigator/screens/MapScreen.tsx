import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Mapbox, { Camera, MapView, MarkerView } from "@rnmapbox/maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import RoomCardInMap from "../../../components/RoomCardInMap";
import { fetchRoomInMap } from "../../../Services/RoomService";
import { ListRoomInMap } from "../../../types/types";
import { MAPBOX_ACCESS_TOKEN } from "@env";
import {
  fontSize,
  hp,
  layout,
  normalize,
  spacing,
  wp,
} from "../../../utils/responsive";

// Configure Mapbox
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

const MapScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);
  const [selectedRoom, setSelectedRoom] = useState<ListRoomInMap | null>(null);
  const [showRoomList, setShowRoomList] = useState(false);
  const [favoriteRoomIds, setFavoriteRoomIds] = useState<string[]>([]);
  const [mapRegion, setMapRegion] = useState({
    latitude: 16.0544,
    longitude: 108.2022,
  });
  const [roomInMap, setRoomInMap] = useState<ListRoomInMap[]>([]);

  useEffect(() => {
    const fetchRoomInMaps = async () => {
      const response = await fetchRoomInMap(16.0544, 108.2022);
      const room = response.data || response;
      console.log("Room in map:", room);
      console.log("Total rooms:", room?.length);
      setRoomInMap(room);
    };
    fetchRoomInMaps();
  }, []);

  const [mapStyle, setMapStyle] = useState<string>(
    "mapbox://styles/mapbox/streets-v12"
  );
  const [isLocating, setIsLocating] = useState(false);

  const handleMarkerPress = (room: ListRoomInMap) => {
    console.log("Marker pressed:", room.id);
    setSelectedRoom(room);
  };

  const handleRoomPress = (roomId: string) => {
    console.log("Navigate to room detail:", roomId);
    navigation.navigate("RoomDetailScreen", { roomId });
  };

  const handleFavorite = (roomId: string) => {
    setFavoriteRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const onMapPress = async (event: any) => {
    const { geometry } = event;
    if (!geometry || !geometry.coordinates) return;

    const [longitude, latitude] = geometry.coordinates;
    console.log("Map pressed at:", { latitude, longitude });

    try {
      const response = await fetchRoomInMap(latitude, longitude);
      const room = response.data || response;
      console.log("Loaded rooms:", room?.length);
      setRoomInMap(room);
      setMapRegion({ latitude, longitude });
    } catch (error) {
      console.error("Error loading rooms:", error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const getCurrentLocation = async () => {
    if (isLocating) return; // Tránh gọi liên tục

    setIsLocating(true);

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "The app needs location access to show your current location on the map."
        );
        setIsLocating(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
      });

      const { latitude, longitude } = location.coords;
      const newRegion = {
        latitude,
        longitude,
      };

      setMapRegion(newRegion);

      // Move camera to current location
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 16,
        animationDuration: 1000,
      });

      const response = await fetchRoomInMap(latitude, longitude);
      const room = response.data || response;
      console.log("Room in map:", room);
      setRoomInMap(room);
    } catch (error) {
      Alert.alert("Error", "Cannot get your current location");
      console.error(error);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={normalize(24)} color="#4A90E2" />
          </TouchableOpacity>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, styles.listButton]}
              onPress={() => setShowRoomList(true)}
            >
              <Ionicons name="list" size={normalize(16)} color="#fff" />
              <Text style={styles.headerButtonText}>List</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.headerButton, styles.mapButton]}>
              <Ionicons name="map" size={normalize(16)} color="#fff" />
              <Text style={styles.headerButtonText}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          styleURL={mapStyle}
          pitchEnabled={false}
          rotateEnabled={false}
          onPress={onMapPress}
        >
          <Camera
            ref={cameraRef}
            centerCoordinate={[mapRegion.longitude, mapRegion.latitude]}
            zoomLevel={12}
            minZoomLevel={8}
            maxZoomLevel={20}
            animationMode="flyTo"
            animationDuration={1000}
          />

          {roomInMap.map((room) => (
            <MarkerView
              key={room.id}
              coordinate={[room.lng || 0, room.lat || 0]}
              anchor={{ x: 0.5, y: 1 }}
              allowOverlap={true}
              allowOverlapWithPuck={true}
            >
              <View
                style={styles.markerContainer}
                onStartShouldSetResponder={() => true}
                onResponderRelease={() => {
                  console.log("=== MARKER PRESSED ===", room.id);
                  setSelectedRoom(room);
                }}
              >
                <Image
                  source={require("../../../../assets/red_position_ants.png")}
                  style={styles.markerImage}
                  resizeMode="contain"
                />
              </View>
            </MarkerView>
          ))}
        </MapView>

        {/* Selected Room Card */}
        {selectedRoom && (
          <View
            style={[styles.selectedRoomContainer, styles.selectedRoomAnimation]}
          >
            <View style={styles.selectedRoomCard}>
              <RoomCardInMap
                room={selectedRoom}
                onPress={() => handleRoomPress(selectedRoom.id)}
                onFavorite={() => handleFavorite(selectedRoom.id)}
                isFavorited={favoriteRoomIds.includes(selectedRoom.id)}
              />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedRoom(null)}
            >
              <Ionicons name="close" size={normalize(20)} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Room List Modal */}
        <Modal
          visible={showRoomList}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>List Rooms</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowRoomList(false)}
              >
                <Ionicons name="close" size={normalize(24)} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.roomList}
              showsVerticalScrollIndicator={false}
            >
              {roomInMap.map((room) => (
                <View key={room.id} style={styles.roomListItem}>
                  <RoomCardInMap
                    room={room}
                    onPress={() => {
                      setShowRoomList(false);
                      setSelectedRoom(room);
                      setMapRegion({
                        latitude: room.lat || mapRegion.latitude,
                        longitude: room.lng || mapRegion.longitude,
                      });
                      cameraRef.current?.setCamera({
                        centerCoordinate: [
                          room.lng || mapRegion.longitude,
                          room.lat || mapRegion.latitude,
                        ],
                        zoomLevel: 16,
                        animationDuration: 1000,
                      });
                    }}
                    onFavorite={() => handleFavorite(room.id)}
                    isFavorited={favoriteRoomIds.includes(room.id)}
                  />
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Map Controls */}
        <View
          style={[
            styles.mapControls,
            selectedRoom && styles.mapControlsWithCard,
          ]}
        >
          {/* My Location Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              isLocating && styles.controlButtonActive,
            ]}
            onPress={getCurrentLocation}
            disabled={isLocating}
          >
            <Ionicons
              name={isLocating ? "radio-button-on" : "locate"}
              size={normalize(20)}
              color={isLocating ? "#FF6B35" : "#4A90E2"}
            />
          </TouchableOpacity>

          {/* Map Type Toggle */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              setMapStyle((prev) => {
                switch (prev) {
                  case "mapbox://styles/mapbox/streets-v12":
                    return "mapbox://styles/mapbox/satellite-streets-v12";
                  case "mapbox://styles/mapbox/satellite-streets-v12":
                    return "mapbox://styles/mapbox/outdoors-v12";
                  case "mapbox://styles/mapbox/outdoors-v12":
                    return "mapbox://styles/mapbox/streets-v12";
                  default:
                    return "mapbox://styles/mapbox/streets-v12";
                }
              });
            }}
          >
            <Ionicons name="layers" size={normalize(20)} color="#4A90E2" />
          </TouchableOpacity>

          {/* Compass */}
          <TouchableOpacity style={styles.controlButton}>
            <View style={styles.compass}>
              <Text style={styles.compassText}>N</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    position: "absolute",
    top: normalize(10),
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    zIndex: 1000,
  },
  backButton: {
    backgroundColor: "#fff",
    borderRadius: normalize(25),
    width: normalize(50),
    height: normalize(50),
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  headerButtons: {
    flexDirection: "row",
    borderRadius: normalize(25),
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  listButton: {
    backgroundColor: "#DC3545",
  },
  mapButton: {
    backgroundColor: "#4A90E2",
  },
  headerButtonText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  map: {
    flex: 1,
  },

  selectedRoomContainer: {
    position: "absolute",
    bottom: spacing["3xl"],
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 2000,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  selectedRoomAnimation: {
    transform: [{ translateY: 0 }],
  },
  selectedRoomCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: normalize(12),
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  closeButton: {
    backgroundColor: "#fff",
    borderRadius: normalize(20),
    width: normalize(40),
    height: normalize(40),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xl,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalCloseButton: {
    padding: spacing.md,
  },
  roomList: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  roomListItem: {
    marginVertical: spacing.md,
  },
  mapControls: {
    position: "absolute",
    bottom: hp(25),
    right: spacing.xl,
    zIndex: 1000,
    gap: spacing.lg,
  },
  mapControlsWithCard: {
    bottom: hp(45), // Dịch chuyển lên cao hơn khi có room card
  },
  controlButton: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "hidden", // Đảm bảo icon không bị tràn ra ngoài
  },
  controlButtonActive: {
    backgroundColor: "#FFF3E0",
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  compass: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  compassText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: "#4A90E2",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerImage: {
    width: normalize(50),
    height: normalize(45),
  },
});

export default MapScreen;
