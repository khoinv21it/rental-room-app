import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ListRoom } from "../types/types";
import { URL_IMAGE } from "../Services/Constants";

const { width } = Dimensions.get("window");

export interface Room {
  id: string;
  title: string;
  address: string;
  area: number;
  description: string;
  price: number;
  images: string[];
  amenities: string[];
  isVip?: boolean;
  rating?: number;
  ownerName: string;
  ownerPhone: string;
  postedDate: string;
  favoriteCount?: number;
}

interface RoomCardProps {
  room: ListRoom;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onPress,
  onFavorite,
  isFavorited = false,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: URL_IMAGE + room.images[0].url }}
          style={styles.image}
        />

        {/* VIP Badge */}
        {/* {room.isVip && (
          <View style={styles.vipBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.vipText}>VIP</Text>
          </View>
        )} */}

        {/* Image Count */}
        {room.images.length > 1 && (
          <View style={styles.imageCount}>
            <Ionicons name="images" size={12} color="#fff" />
            <Text style={styles.imageCountText}>{room.images.length}</Text>
          </View>
        )}

        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={20}
            color={isFavorited ? "#FF6B6B" : "#fff"}
          />
          {room.favoriteCount && (
            <Text style={styles.favoriteCount}>{room.favoriteCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {room.title}
        </Text>

        {/* Location */}
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.address} numberOfLines={1}>
            {room.address.street +
              " " +
              room.address.ward.name +
              ", " +
              room.address.ward.district.name +
              ", " +
              room.address.ward.district.province.name}
          </Text>
          <Text style={styles.area}>• {room.area}m²</Text>
        </View>

        {/* Description */}
        {/* Removed description and amenities for compact card */}

        {/* Price and Button */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price per month</Text>
            <Text style={styles.price}>
              {formatPrice(room.priceMonth)}{" "}
              <Text style={styles.currency}>VND</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.viewButton} onPress={onPress}>
            <Text style={styles.viewButtonText}>View room</Text>
          </TouchableOpacity>
        </View>

        {/* Owner Info */}
        <View style={styles.ownerContainer}>
          <View style={styles.ownerInfo}>
            <View style={styles.avatar}>
              <Image
                source={{
                  uri: URL_IMAGE + room.landlord.landlordProfile.avatar,
                }}
                style={styles.image}
              />
            </View>
            <View>
              <Text style={styles.ownerName}>
                {room.landlord.landlordProfile.fullName}
              </Text>
            </View>
          </View>

          <View style={styles.contactContainer}>
            <View style={styles.onlineStatus} />
            <Text style={styles.contactText}>Contact</Text>
            <Text style={styles.phoneNumber}>
              {room.landlord.landlordProfile.phoneNumber ||
                room.landlord.landlordProfile.email}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: "relative",
    height: 150,
  },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  vipBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#FF8C00",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vipText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  imageCount: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  imageCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteCount: {
    color: "#fff",
    fontSize: 10,
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    textAlign: "center",
    lineHeight: 16,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  address: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  area: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  /* description and amenities removed to keep card compact */
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00C853",
  },
  currency: {
    fontSize: 14,
    fontWeight: "400",
  },
  viewButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  ownerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f7f7f7",
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  ownerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  postedDate: {
    fontSize: 12,
    color: "#888",
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  onlineStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00C853",
  },
  contactText: {
    fontSize: 12,
    color: "#666",
  },
  phoneNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a1a",
  },
});

export default RoomCard;
