import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
  Alert,
  Modal,
  Dimensions,
} from "react-native";

import { Video, ResizeMode } from "expo-av";
import { RootStackParamList } from "../index";
import { LandLordByRoomId, RoomDetail } from "../../../types/types";
import { fetchRoomDetail } from "../../../Services/RoomService";
import { URL_IMAGE } from "../../../Services/Constants";
import { getLandlordByRoomId } from "../../../Services/LandLordService";
import RoomLocationMap from "../../../components/RoomLocationMap";

type RoomDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "RoomDetailScreen"
>;
const nearbyPlaces = [
  {
    category: "Dining",
    count: 2,
    icon: "🍽️",
    places: ["Restaurant Phố Biển - 294m", "Seafood Restaurant - 450m"],
  },
  {
    category: "Education",
    count: 2,
    icon: "🎓",
    places: ["Thé School - 500m", "Hoa Hai Secondary School - 800m"],
  },
  {
    category: "Shopping",
    count: 3,
    icon: "🛒",
    places: [
      "MM Mega Market Da Nang - 604m",
      "Lotte Mart - 1.2km",
      "Co.opmart - 1.5km",
    ],
  },
  {
    category: "Banking",
    count: 3,
    icon: "🏦",
    places: ["ATM DongA Bank - 691m", "Vietcombank - 750m", "BIDV - 900m"],
  },
  {
    category: "Healthcare",
    count: 2,
    icon: "🏥",
    places: ["Da Nang Hospital - 739m", "General Clinic - 850m"],
  },
  {
    category: "Entertainment",
    count: 2,
    icon: "🎪",
    places: ["Park View Apartment - 793m", "Beach Park - 1.8km"],
  },
];
export default function RoomDetailScreen() {
  const route = useRoute<RoomDetailScreenRouteProp>();
  const navigation = useNavigation();

  // Lấy dữ liệu từ route params hoặc dùng sample data
  const roomId = route.params?.roomId;
  console.log("RoomDetailScreen roomId:", roomId);
  // const thumbnails = roomData.images?.map((img: any) => img.url) || [];

  const [selectedImage, setSelectedImage] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [roomData, setRoomData] = useState<RoomDetail>();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [landlordData, setLandlordData] = useState<LandLordByRoomId>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);

  const thumbnails = roomData?.images?.map((img: any) => img.url) || [];
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  // Helper function to check if file is video
  const isVideoFile = (filename: string | undefined) => {
    if (!filename) return false;
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"];
    return videoExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  };

  // Reset playing state when thumbnail changes
  useEffect(() => {
    setIsPlaying(false);
  }, [selectedImage]);

  const openZoomModal = (index: number) => {
    console.log("Opening zoom modal for index:", index);
    console.log("Thumbnail:", thumbnails[index]);
    console.log("Is video:", isVideoFile(thumbnails[index]));
    setZoomImageIndex(index);
    setShowZoomModal(true);
  };

  const closeZoomModal = () => {
    setShowZoomModal(false);
  };

  const navigateZoomImage = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setZoomImageIndex(
        zoomImageIndex > 0 ? zoomImageIndex - 1 : thumbnails.length - 1
      );
    } else {
      setZoomImageIndex(
        zoomImageIndex < thumbnails.length - 1 ? zoomImageIndex + 1 : 0
      );
    }
  };

  const handleShare = async () => {
    try {
      if (!roomId) {
        Alert.alert("Error", "Room not found");
        return;
      }

      const shareUrl = `http://localhost:3000/detail/${roomId}`;

      const result = await Share.share({
        message: shareUrl,
        url: shareUrl,
      });

      if (result.action === Share.sharedAction) {
        console.log("Link shared successfully");
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share link");
    }
  };

  useEffect(() => {
    const fetchRoomData = async () => {
      if (!roomId) return;
      const response = await fetchRoomDetail(roomId);
      const room = response.data || response;
      setRoomData(room);
    };
    fetchRoomData();
  }, [roomId]);

  useEffect(() => {
    const fetchLandlordData = async () => {
      if (!roomId) return;
      const response = await getLandlordByRoomId(roomId);
      const landlord = response.data || response;
      setLandlordData(landlord);
    };
    fetchLandlordData();
  }, [roomId]);
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {thumbnails[selectedImage] &&
          isVideoFile(thumbnails[selectedImage]) ? (
            <TouchableOpacity
              onPress={() => openZoomModal(selectedImage)}
              activeOpacity={0.9}
            >
              <View style={styles.videoContainer}>
                <Video
                  source={{ uri: URL_IMAGE + thumbnails[selectedImage] }}
                  style={styles.mainImage}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={isPlaying}
                  isLooping={false}
                />
                {!isPlaying && (
                  <TouchableOpacity
                    style={styles.mainPlayButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      setIsPlaying(true);
                    }}
                  >
                    <View style={styles.mainPlayIcon}>
                      <Ionicons name="play" size={32} color="#fff" />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ) : thumbnails[selectedImage] ? (
            <TouchableOpacity onPress={() => openZoomModal(selectedImage)}>
              <Image
                source={{ uri: URL_IMAGE + thumbnails[selectedImage] }}
                style={styles.mainImage}
              />
            </TouchableOpacity>
          ) : (
            <View style={[styles.mainImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={64} color="#9ca3af" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          {/* Header Buttons */}
          <View
            style={[
              styles.headerButtons,
              thumbnails[selectedImage] &&
                isVideoFile(thumbnails[selectedImage]) &&
                styles.headerButtonsVideo,
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* VIP Badge */}
          {roomData?.typepost == "Post VIP" && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipIcon}>⭐</Text>
              <Text style={styles.vipText}>VIP</Text>
            </View>
          )}

          {/* Image Counter */}
          <View
            style={[
              styles.imageCounter,
              thumbnails[selectedImage] &&
                isVideoFile(thumbnails[selectedImage]) &&
                styles.imageCounterVideo,
            ]}
          >
            <Text style={styles.imageCounterText}>
              {selectedImage + 1}/{thumbnails.length}
            </Text>
          </View>

          {/* Thumbnail Strip */}
          <View style={styles.thumbnailContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContent}
            >
              {thumbnails.map((img: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedImage(idx)}
                  style={[
                    styles.thumbnail,
                    selectedImage === idx && styles.thumbnailSelected,
                  ]}
                >
                  {isVideoFile(img) ? (
                    <View style={styles.videoThumbnailContainer}>
                      <Video
                        source={{ uri: URL_IMAGE + img }}
                        style={styles.thumbnailImage}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isLooping={false}
                      />
                      <View style={styles.playIcon}>
                        <Ionicons name="play" size={16} color="#fff" />
                      </View>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: URL_IMAGE + img }}
                      style={styles.thumbnailImage}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Price Card */}
          <View style={styles.priceCard}>
            <Text style={styles.title}>{roomData?.title}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {roomData?.priceMonth?.toLocaleString("vi-VN")}₫
              </Text>
              <Text style={styles.month}>/month</Text>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.locationText}>
                {roomData?.address?.street}, {roomData?.address?.ward?.name},{" "}
                {roomData?.address?.ward?.district?.name},{" "}
                {roomData?.address?.ward?.district?.province?.name}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#6b7280" />
                <Text style={styles.metaText}>
                  {roomData?.postStartDate
                    ? new Date(roomData.postStartDate).toLocaleDateString(
                        "vi-VN",
                        {
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : "Today"}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={14} color="#6b7280" />
                <Text style={styles.metaText}>{roomData?.viewCount} views</Text>
              </View>
            </View>
          </View>

          {/* Quick Specs */}
          <View style={styles.quickSpecs}>
            <View style={styles.specCard}>
              <Ionicons name="resize-outline" size={28} color="#4f46e5" />
              <Text style={styles.specNumber}>{roomData?.area}m²</Text>
              <Text style={styles.specLabel}>Area</Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons name="people-outline" size={28} color="#4f46e5" />
              <Text style={styles.specNumber}>{roomData?.maxPeople}</Text>
              <Text style={styles.specLabel}>Capacity</Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons name="flash-outline" size={28} color="#4f46e5" />
              <Text style={styles.specNumber}>
                {roomData?.elecPrice?.toLocaleString("vi-VN")}₫
              </Text>
              <Text style={styles.specLabel}>Electric/kWh</Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons name="water-outline" size={28} color="#4f46e5" />
              <Text style={styles.specNumber}>
                {roomData?.waterPrice?.toLocaleString("vi-VN")}₫
              </Text>
              <Text style={styles.specLabel}>Water/m³</Text>
            </View>
          </View>

          {/* Room Specifications */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="home-outline" size={24} color="#4f46e5" />
              <Text style={styles.sectionTitle}>Convenients</Text>
            </View>
            <View style={styles.conveniencesContainer}>
              {roomData?.convenients?.map((convenience, index) => (
                <View key={index} style={styles.convenienceItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.convenienceText}>{convenience.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#4f46e5"
              />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.description}>
              {roomData?.description &&
              roomData.description.length > 150 &&
              !isDescriptionExpanded
                ? `${roomData.description.substring(0, 150)}...`
                : roomData?.description}
            </Text>
            {roomData?.description && roomData.description.length > 150 && (
              <TouchableOpacity
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                style={styles.expandButton}
              >
                <Text style={styles.expandButtonText}>
                  {isDescriptionExpanded ? "Show less" : "Show more"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Nearby Places */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="map-outline" size={24} color="#4f46e5" />
              <Text style={styles.sectionTitle}>Nearby Places</Text>
            </View>
            <Text style={styles.nearbySubtitle}>15 places • Nearest: 294m</Text>

            <View style={styles.nearbyList}>
              {nearbyPlaces.map((item, idx) => (
                <View key={idx} style={styles.nearbyCard}>
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedCategory(expandedCategory === idx ? null : idx)
                    }
                    style={styles.nearbyHeader}
                  >
                    <View style={styles.nearbyTitleRow}>
                      <Text style={styles.nearbyIcon}>{item.icon}</Text>
                      <Text style={styles.nearbyCategory}>{item.category}</Text>
                      <View style={styles.nearbyBadge}>
                        <Text style={styles.nearbyBadgeText}>{item.count}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={
                        expandedCategory === idx ? "chevron-up" : "chevron-down"
                      }
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                  {expandedCategory === idx && (
                    <View style={styles.nearbyPlaces}>
                      {item.places.map((place, pIdx) => (
                        <View key={pIdx} style={styles.nearbyPlaceItem}>
                          <Text style={styles.nearbyPlaceBullet}>•</Text>
                          <Text style={styles.nearbyPlaceText}>{place}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Map */}
          <RoomLocationMap
            address={roomData?.address}
            roomTitle={roomData?.title}
            roomPrice={roomData?.priceMonth}
          />

          {/* Owner Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={24} color="#4f46e5" />
              <Text style={styles.sectionTitle}>Owner Information</Text>
            </View>

            <View style={styles.ownerCard}>
              {landlordData?.avatar ? (
                <Image
                  source={{
                    uri: URL_IMAGE + landlordData?.avatar,
                  }}
                  style={styles.ownerAvatar}
                />
              ) : (
                <Ionicons
                  name="person-circle-outline"
                  size={64}
                  color="#9ca3af"
                  style={styles.ownerAvatar}
                />
              )}
              <View style={styles.ownerInfo}>
                <View style={styles.ownerNameRow}>
                  <Text style={styles.ownerName}>
                    {landlordData?.fullName || "Owner"}
                  </Text>
                  {true && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color="#10b981"
                      />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>

                <View style={styles.ownerStats}>
                  <View style={styles.ownerStat}>
                    <Ionicons name="home-outline" size={14} color="#6b7280" />
                    <Text style={styles.ownerStatText}>
                      {landlordData?.amountPost || 0} Listings
                    </Text>
                  </View>
                  <View style={styles.ownerStat}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#6b7280"
                    />
                    <Text style={styles.ownerStatText}>
                      Since {landlordData?.createDate || "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.ownerContact}>
                  <View style={styles.ownerPhone}>
                    <Ionicons name="call-outline" size={14} color="#ef4444" />
                    <Text style={styles.ownerPhoneText}>
                      {landlordData?.phone || landlordData?.email}
                    </Text>
                  </View>
                  <View style={styles.ownerStatus}>
                    <View style={styles.offlineDot} />
                    <Text style={styles.ownerStatusText}>Offline</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Spacing for Fixed Action Bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          onPress={() => setIsFavorite(!isFavorite)}
          style={[
            styles.favoriteButton,
            isFavorite && styles.favoriteButtonActive,
          ]}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? "#ef4444" : "#4f46e5"}
          />
          <Text
            style={[
              styles.favoriteButtonText,
              isFavorite && styles.favoriteButtonTextActive,
            ]}
          >
            Favorite
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>

      {/* Zoom Modal */}
      <Modal
        visible={showZoomModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeZoomModal}
      >
        <View style={styles.zoomModalContainer}>
          <TouchableOpacity
            style={styles.zoomCloseButton}
            onPress={closeZoomModal}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          <View style={styles.zoomContent}>
            {thumbnails[zoomImageIndex] &&
            isVideoFile(thumbnails[zoomImageIndex]) ? (
              <Video
                source={{ uri: URL_IMAGE + thumbnails[zoomImageIndex] }}
                style={styles.zoomVideoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
              />
            ) : thumbnails[zoomImageIndex] ? (
              <Image
                source={{ uri: URL_IMAGE + thumbnails[zoomImageIndex] }}
                style={styles.zoomImageDisplay}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.noContentText}>No media available</Text>
            )}
          </View>

          {/* Navigation Buttons */}
          {thumbnails.length > 1 && (
            <>
              <TouchableOpacity
                style={styles.navButtonLeft}
                onPress={() => navigateZoomImage("prev")}
              >
                <Ionicons name="chevron-back" size={32} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navButtonRight}
                onPress={() => navigateZoomImage("next")}
              >
                <Ionicons name="chevron-forward" size={32} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          <View style={styles.zoomImageCounter}>
            <Text style={styles.zoomImageCounterText}>
              {zoomImageIndex + 1}/{thumbnails.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  imageGallery: {
    position: "relative",
    height: 300,
    backgroundColor: "#000",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerButtons: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerButtonsVideo: {
    top: 60, // Move buttons down when video is playing to avoid blocking controls
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  vipBadge: {
    position: "absolute",
    top: 16,
    left: 80,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eab308",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  vipIcon: {
    color: "#fff",
    fontSize: 12,
  },
  vipText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
  imageCounter: {
    position: "absolute",
    bottom: 80,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  imageCounterVideo: {
    bottom: 120, // Move counter up when video is playing to avoid blocking controls
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  thumbnailContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  thumbnailContent: {
    gap: 8,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbnailSelected: {
    borderColor: "#4f46e5",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  content: {
    paddingHorizontal: 16,
  },
  priceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: -24,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ef4444",
  },
  month: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#6b7280",
    flex: 1,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#6b7280",
  },
  quickSpecs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  specCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  specNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 8,
  },
  specLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
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
  description: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },
  expandButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  expandButtonText: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "500",
  },
  specGrid: {
    flexDirection: "row",
    gap: 12,
  },
  specItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  specItemLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  specItemValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 4,
  },
  conveniencesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  convenienceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    gap: 6,
  },
  convenienceText: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "500",
  },
  nearbySubtitle: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 12,
  },
  nearbyList: {
    gap: 12,
  },
  nearbyCard: {
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  nearbyHeader: {
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  nearbyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nearbyIcon: {
    fontSize: 18,
  },
  nearbyCategory: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  nearbyBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nearbyBadgeText: {
    fontSize: 12,
    color: "white",
  },
  nearbyPlaces: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nearbyPlaceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  nearbyPlaceBullet: {
    color: "#4f46e5",
    marginRight: 6,
  },
  nearbyPlaceText: {
    fontSize: 14,
    color: "#4b5563",
  },

  ownerCard: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ownerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#d1fae5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 12,
    color: "#10b981",
  },
  ownerStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  ownerStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ownerStatText: {
    color: "#6b7280",
    fontSize: 12,
  },
  ownerContact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ownerPhone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ownerPhoneText: {
    fontSize: 14,
    color: "#ef4444",
  },
  ownerStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  offlineDot: {
    width: 8,
    height: 8,
    backgroundColor: "#9ca3af",
    borderRadius: 4,
  },
  ownerStatusText: {
    fontSize: 12,
    color: "#6b7280",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  favoriteButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#4f46e5",
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  favoriteButtonActive: {
    borderColor: "#ef4444",
    backgroundColor: "#fee2e2",
  },
  favoriteButtonText: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "600",
  },
  favoriteButtonTextActive: {
    color: "#ef4444",
  },
  messageButton: {
    flex: 1,
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  videoThumbnailContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
    zIndex: 1,
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  videoZoomOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  mainPlayButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -40 }, { translateY: -40 }],
    zIndex: 2,
  },
  mainPlayIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  placeholderImage: {
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#9ca3af",
    fontSize: 16,
    marginTop: 8,
  },
  zoomModalContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  zoomCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomScrollView: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  zoomImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  zoomMedia: {
    width: "100%",
    height: "100%",
  },
  imageZoomContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  imageZoomContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100%",
  },
  zoomImage: {
    width: 350,
    height: 350,
    maxWidth: "90%",
    maxHeight: "70%",
  },
  zoomImageCounter: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  zoomImageCounterText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  zoomContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 100,
  },
  zoomVideoPlayer: {
    width: "90%",
    height: "70%",
    backgroundColor: "#000",
  },
  imageScrollContent: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100%",
  },
  zoomImageDisplay: {
    width: "90%",
    height: "70%",
    maxWidth: "100%",
    maxHeight: "70%",
  },
  noContentContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noContentText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  navButtonLeft: {
    position: "absolute",
    left: 20,
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  navButtonRight: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
