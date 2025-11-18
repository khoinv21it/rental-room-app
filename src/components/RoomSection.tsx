import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import RoomCard, { Room } from "./RoomCard";
import { ListRoom } from "../types/types";
import {
  normalize,
  fontSize,
  spacing,
  layout,
  wp,
  isSmallDevice,
} from "../utils/responsive";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color="#FF8C00" />
          </View>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
};

interface RoomSectionProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rooms: ListRoom[];
  onViewAll?: () => void;
  onRoomPress: (roomId: string) => void;
  onFavorite?: (roomId: string) => void;
  favoriteRoomIds?: string[];
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  loading?: boolean;
}

const RoomSection: React.FC<RoomSectionProps> = ({
  title,
  subtitle,
  icon,
  rooms,
  onRoomPress,
  onFavorite,
  favoriteRoomIds = [],
  currentPage = 0,
  totalPages = 1,
  onPrevPage,
  onNextPage,
  loading = false,
}) => {
  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title={title} subtitle={subtitle} icon={icon} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {rooms.map((room, index) => (
          <View
            key={room.id}
            style={[
              styles.cardContainer,
              index === 0 && styles.firstCard,
              index === rooms.length - 1 && styles.lastCard,
            ]}
          >
            <RoomCard
              room={room}
              onPress={() => onRoomPress(room.id)}
              onFavorite={() => onFavorite?.(room.id)}
              isFavorited={favoriteRoomIds.includes(room.id)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[
              styles.pageButton,
              currentPage === 0 && styles.pageButtonDisabled,
            ]}
            onPress={onPrevPage}
            disabled={currentPage === 0 || loading}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={currentPage === 0 ? "#ccc" : "#4A90E2"}
            />
            <Text
              style={[
                styles.pageButtonText,
                currentPage === 0 && styles.pageButtonTextDisabled,
              ]}
            >
              Prev
            </Text>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            {currentPage + 1} / {totalPages}
          </Text>

          <TouchableOpacity
            style={[
              styles.pageButton,
              currentPage === totalPages - 1 && styles.pageButtonDisabled,
            ]}
            onPress={onNextPage}
            disabled={currentPage === totalPages - 1 || loading}
          >
            <Text
              style={[
                styles.pageButtonText,
                currentPage === totalPages - 1 && styles.pageButtonTextDisabled,
              ]}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={currentPage === totalPages - 1 ? "#ccc" : "#4A90E2"}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: spacing["3xl"],
    marginTop: spacing["2xl"],
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.lg,
  },
  title: {
    fontSize: isSmallDevice ? fontSize.lg : fontSize.xl,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: "#666",
    lineHeight: normalize(20),
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F2FF",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: normalize(16),
    gap: spacing.sm,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    color: "#4A90E2",
    fontWeight: "600",
  },
  scrollContainer: {
    paddingLeft: layout.screenPadding,
  },
  cardContainer: {
    width: isSmallDevice ? wp(75) : wp(70),
    marginRight: spacing.xl,
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: layout.screenPadding,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F2FF",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: normalize(6),
    gap: spacing.sm,
  },
  pageButtonDisabled: {
    backgroundColor: "#f5f5f5",
  },
  pageButtonText: {
    fontSize: fontSize.sm,
    color: "#4A90E2",
    fontWeight: "600",
  },
  pageButtonTextDisabled: {
    color: "#ccc",
  },
  pageInfo: {
    fontSize: fontSize.base,
    color: "#666",
    fontWeight: "500",
  },
});

export default RoomSection;
