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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  currentAreaContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentAreaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  currentAreaIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  currentAreaLabel: {
    fontSize: 12,
    color: "#4A90E2",
    fontWeight: "500",
  },
  currentAreaText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginLeft: 32,
  },
  locationButton: {
    padding: 4,
  },
  searchInputContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 4,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  mapButtonText: {
    fontSize: 12,
    color: "#4A90E2",
    fontWeight: "500",
  },
  filtersContainer: {
    gap: 8,
  },
  toggleButton: {
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleButtonText: {
    fontSize: 12,
    color: "#4A90E2",
    fontWeight: "500",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterButtonFull: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 36,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonHalf: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 36,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  searchButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
    flex: 1,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  advancedButton: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
    minHeight: 36,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageButton: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
    minHeight: 36,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

export default SearchBar;
