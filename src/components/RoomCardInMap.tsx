import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ListRoom, ListRoomInMap } from "../types/types";
import { URL_IMAGE } from "../Services/Constants";
import { addFavorite, removeFavorite } from "../Services/FavoriteService";
import useFavoriteStore from "../Stores/useFavoriteStore";
import {
  normalize,
  fontSize,
  spacing,
  layout,
  isSmallDevice,
} from "../utils/responsive";
import Toast from "react-native-toast-message";

interface RoomCardInMapProps {
  room: ListRoomInMap;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

const RoomCardInMap: React.FC<RoomCardInMapProps> = ({
  room,
  onPress,
  onFavorite,
  isFavorited = false,
}) => {
  const favoriteIds = useFavoriteStore((s) => s.favoriteRoomIds);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Check if room is favorited from store
  const isFav = favoriteIds.has(room.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handleToggleFavorite = async (e: any) => {
    e.stopPropagation(); // Prevent card press

    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      if (isFav) {
        await removeFavorite(room.id);
        Toast.show({
          type: "success",
          text1: "Removed from favorites",
          text2: `${room.title || "Room"} has been removed from your favorites`,
          position: "bottom",
          visibilityTime: 2000,
        });
      } else {
        await addFavorite(room.id);
        Toast.show({
          type: "success",
          text1: "Added to favorites",
          text2: `${room.title || "Room"} has been added to your favorites`,
          position: "top",
          visibilityTime: 2000,
        });
      }

      // Call parent callback if provided
      if (onFavorite) {
        onFavorite();
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      Toast.show({
        type: "error",
        text1: "Action failed",
        text2: "Could not update favorites. Please try again.",
        position: "top",
        visibilityTime: 2000,
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: URL_IMAGE + (room.imageUrl || "") }}
          style={styles.image}
        />

        {/* VIP Badge */}
        {room.postType == "Post VIP" && (
          <View style={styles.vipBadge}>
            <Ionicons name="star" size={normalize(12)} color="#fff" />
            <Text style={styles.vipText}>VIP</Text>
          </View>
        )}
        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
          disabled={isTogglingFavorite}
        >
          {isTogglingFavorite ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={normalize(20)}
              color={isFav ? "#FF6B6B" : "#fff"}
            />
          )}
          {/* {(room.favoriteCount ?? 0) > 0 && (
            <Text style={styles.favoriteCount}>{room.favoriteCount}</Text>
          )} */}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {room.title || "Untitled Room"}
        </Text>

        {/* Location */}
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={normalize(14)} color="#666" />
          <Text style={styles.address} numberOfLines={1}>
            {[room.fullAddress].filter(Boolean).join(", ") ||
              "No address available"}
          </Text>
          <Text style={styles.area}>• {room.area || 0}m²</Text>
        </View>

        {/* Description */}
        {/* Removed description and amenities for compact card */}

        {/* Price and Button */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price per month</Text>
            <Text style={styles.price}>
              {formatPrice(room.priceMonth || 0)}
              <Text style={styles.currency}>VND</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.viewButton} onPress={onPress}>
            <Text style={styles.viewButtonText}>View room</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: normalize(12),
    marginBottom: spacing.xl,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: normalize(8),
    elevation: 4,
  },
  imageContainer: {
    position: "relative",
    height: isSmallDevice ? normalize(120) : normalize(150),
  },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: normalize(12),
    borderTopRightRadius: normalize(12),
  },
  vipBadge: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    backgroundColor: "#FF8C00",
    borderRadius: normalize(16),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  vipText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  imageCount: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: normalize(16),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  imageCountText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  favoriteButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: normalize(20),
    width: normalize(36),
    height: normalize(36),
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteCount: {
    color: "#fff",
    fontSize: fontSize.xs,
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF6B6B",
    borderRadius: normalize(8),
    minWidth: normalize(16),
    height: normalize(16),
    textAlign: "center",
    lineHeight: normalize(16),
  },
  content: {
    padding: layout.cardPadding,
  },
  title: {
    fontSize: isSmallDevice ? fontSize.base : fontSize.md,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: spacing.sm,
    lineHeight: isSmallDevice ? fontSize.lg : fontSize.xl,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    flexWrap: "wrap",
  },
  address: {
    fontSize: fontSize.base,
    color: "#666",
    marginLeft: spacing.sm,
    flex: 1,
  },
  area: {
    fontSize: fontSize.base,
    color: "#666",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing.md,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: "#666",
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: isSmallDevice ? fontSize.lg : fontSize.xl,
    fontWeight: "700",
    color: "#00C853",
  },
  currency: {
    fontSize: fontSize.base,
    fontWeight: "400",
  },
  viewButton: {
    backgroundColor: "#FF6B35",
    borderRadius: normalize(8),
    paddingHorizontal: isSmallDevice ? spacing.lg : spacing["2xl"],
    paddingVertical: spacing.md,
  },
  viewButtonText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  ownerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#f7f7f7",
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    overflow: "hidden",
  },
  avatarImage: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
  },
  avatarText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  ownerName: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  postedDate: {
    fontSize: fontSize.sm,
    color: "#888",
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  onlineStatus: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: "#00C853",
  },
  contactText: {
    fontSize: fontSize.sm,
    color: "#666",
  },
  phoneNumber: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: "#1a1a1a",
  },
});

export default RoomCardInMap;
