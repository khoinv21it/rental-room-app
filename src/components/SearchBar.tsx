import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  normalize,
  fontSize,
  spacing,
  layout,
  isSmallDevice,
} from "../utils/responsive";

const { width } = Dimensions.get("window");

interface SearchBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  selectedProvince: string;
  selectedDistrict: string;
  selectedWard: string;
  onProvinceChange: (province: string) => void;
  onDistrictChange: (district: string) => void;
  onWardChange: (ward: string) => void;
  onSearch: () => void;
  currentArea?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchText,
  onSearchChange,
  selectedProvince,
  selectedDistrict,
  selectedWard,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  onSearch,
  currentArea = "80 Ca Văn Thỉnh, Phường 11, Tân Bình, Hồ Chí Minh",
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* Current Search Area */}
      <View style={styles.currentAreaContainer}>
        <View style={styles.currentAreaHeader}>
          <View style={styles.currentAreaIcon}>
            <Ionicons name="location" size={16} color="#4A90E2" />
          </View>
          <Text style={styles.currentAreaLabel}>Current Search Area:</Text>
        </View>
        <Text style={styles.currentAreaText}>{currentArea}</Text>
        <TouchableOpacity style={styles.locationButton}>
          <Ionicons name="navigate" size={16} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchInputContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter specific address (house number, street name)..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={onSearchChange}
        />
        <TouchableOpacity style={styles.mapButton}>
          <Ionicons name="map" size={16} color="#4A90E2" />
          <Text style={styles.mapButtonText}>View Map</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle Button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        {/* <Ionicons name="options-outline" size={16} color="#4A90E2" /> */}
        <Text style={styles.toggleButtonText}>
          {isExpanded ? "Close" : "More"}
        </Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#4A90E2"
        />
      </TouchableOpacity>

      {/* Filter Options */}
      {isExpanded && (
        <View style={styles.filtersContainer}>
          {/* Province Row */}
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterButtonFull}>
              <Text style={styles.filterButtonText}>
                {selectedProvince || "Select Province/City"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* District and Ward Row */}
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterButtonHalf}>
              <Text style={styles.filterButtonText}>
                {selectedDistrict || "Select District"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterButtonHalf}>
              <Text style={styles.filterButtonText}>
                {selectedWard || "Select Ward"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
              <Ionicons name="search" size={16} color="#fff" />
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.advancedButton}>
              <Ionicons name="options" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.messageButton}>
              <Ionicons name="chatbubble" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9ff",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  currentAreaContainer: {
    backgroundColor: "#fff",
    borderRadius: normalize(8),
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: normalize(2),
    elevation: 1,
  },
  currentAreaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  currentAreaIcon: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  currentAreaLabel: {
    fontSize: fontSize.sm,
    color: "#4A90E2",
    fontWeight: "500",
  },
  currentAreaText: {
    fontSize: fontSize.base,
    color: "#333",
    flex: 1,
    marginLeft: normalize(32),
  },
  locationButton: {
    padding: spacing.sm,
  },
  searchInputContainer: {
    backgroundColor: "#fff",
    borderRadius: normalize(8),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: normalize(2),
    elevation: 1,
  },
  searchIcon: {
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: "#333",
    paddingVertical: spacing.sm,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F2FF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: normalize(6),
    gap: spacing.sm,
  },
  mapButtonText: {
    fontSize: fontSize.sm,
    color: "#4A90E2",
    fontWeight: "500",
  },
  filtersContainer: {
    gap: spacing.md,
  },
  toggleButton: {
    backgroundColor: "#fff",
    borderRadius: normalize(6),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: normalize(2),
    elevation: 1,
  },
  toggleButtonText: {
    fontSize: fontSize.sm,
    color: "#4A90E2",
    fontWeight: "500",
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  filterButtonFull: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: normalize(6),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: normalize(36),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: normalize(2),
    elevation: 1,
  },
  filterButtonHalf: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: normalize(6),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: normalize(36),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: normalize(2),
    elevation: 1,
  },
  filterButtonText: {
    fontSize: isSmallDevice ? fontSize.xs : fontSize.sm,
    color: "#666",
    flex: 1,
  },
  searchButton: {
    backgroundColor: "#4A90E2",
    borderRadius: normalize(6),
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: normalize(36),
    flex: 1,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  advancedButton: {
    backgroundColor: "#fff",
    borderRadius: normalize(6),
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: normalize(36),
    minHeight: normalize(36),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: normalize(2),
    elevation: 1,
  },
  messageButton: {
    backgroundColor: "#fff",
    borderRadius: normalize(6),
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: normalize(36),
    minHeight: normalize(36),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: normalize(2),
    elevation: 1,
  },
});

export default SearchBar;
