import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  ActivityIndicator,
  Switch,
  Pressable,
} from "react-native";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";
import { RootStackParamList } from "../screens/StackNavigator";
import {
  fontSize,
  isSmallDevice,
  layout,
  normalize,
  spacing,
} from "../utils/responsive";
import {
  getProvinces,
  getDistricts,
  getWards,
  geocodeAddress,
  reverseGeocodeCoordinates,
} from "../Services/AddressService";
import { Province, District, Ward } from "../types/types";
import {
  getUserPreferences,
  updateUserPreferences,
  getEmailNotifications,
  setEmailNotifications as updateEmailNotifications,
} from "../Services/ProfileService";
import useAuthStore from "../Stores/useAuthStore";
import useLocationStore from "../Stores/useLocationStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  onCurrentAreaChange?: (area: string) => void;
}

interface SelectOption {
  label: string;
  value: string;
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
  currentArea = "Searching all areas",
  onCurrentAreaChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get current user and location store
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const userId = currentUser?.id;
  const { setLocation } = useLocationStore();

  // Display area state
  const [displayArea, setDisplayArea] = useState(currentArea);

  // Modal states
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);

  // Data states
  const [provinces, setProvinces] = useState<SelectOption[]>([]);
  const [districts, setDistricts] = useState<SelectOption[]>([]);
  const [wards, setWards] = useState<SelectOption[]>([]);

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Labels for display
  const [provinceLabel, setProvinceLabel] = useState("");
  const [districtLabel, setDistrictLabel] = useState("");
  const [wardLabel, setWardLabel] = useState("");

  // Email notifications state
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [loadingEmailNotifications, setLoadingEmailNotifications] =
    useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);

  // Info popup state
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  // Track if preferences have been loaded
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
    if (userId) {
      loadUserPreferences();
      loadEmailNotificationSettings();
    } else {
      // If not logged in, mark as loaded so prop can be used
      setPreferencesLoaded(true);
    }
  }, [userId]);

  // Update display area when prop changes - but only if preferences not loaded yet
  useEffect(() => {
    if (currentArea && !preferencesLoaded) {
      setDisplayArea(currentArea);
    }
  }, [currentArea, preferencesLoaded]);

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await getProvinces();
      const data = Array.isArray(response) ? response : response.data || [];
      const options = data.map((item: Province) => ({
        label: item.name,
        value: String(item.id),
      }));
      setProvinces(options);
    } catch (error) {
      console.error("Error loading provinces:", error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const handleProvinceSelect = async (provinceId: string, label: string) => {
    onProvinceChange(provinceId);
    setProvinceLabel(label);
    setShowProvinceModal(false);

    // Reset district and ward
    onDistrictChange("");
    onWardChange("");
    setDistrictLabel("");
    setWardLabel("");
    setDistricts([]);
    setWards([]);

    // Load districts for selected province
    if (provinceId) {
      setLoadingDistricts(true);
      try {
        const response = await getDistricts(provinceId);
        const data = Array.isArray(response) ? response : response.data || [];
        const options = data.map((item: District) => ({
          label: item.name,
          value: String(item.id),
        }));
        setDistricts(options);
      } catch (error) {
        console.error("Error loading districts:", error);
      } finally {
        setLoadingDistricts(false);
      }
    }
  };

  const handleDistrictSelect = async (districtId: string, label: string) => {
    onDistrictChange(districtId);
    setDistrictLabel(label);
    setShowDistrictModal(false);

    // Reset ward
    onWardChange("");
    setWardLabel("");
    setWards([]);

    // Load wards for selected district
    if (districtId) {
      setLoadingWards(true);
      try {
        const response = await getWards(districtId);
        const data = Array.isArray(response) ? response : response.data || [];
        const options = data.map((item: Ward) => ({
          label: item.name,
          value: String(item.id),
        }));
        setWards(options);
      } catch (error) {
        console.error("Error loading wards:", error);
      } finally {
        setLoadingWards(false);
      }
    }
  };

  const handleWardSelect = (wardId: string, label: string) => {
    onWardChange(wardId);
    setWardLabel(label);
    setShowWardModal(false);
  };

  // Load user preferences from backend
  const loadUserPreferences = async () => {
    if (!userId) return;

    try {
      console.log(
        "📥 [SearchBar] Loading user preferences for userId:",
        userId
      );
      const response = await getUserPreferences(userId);
      const prefs = (response as any)?.data || response;

      if (prefs) {
        console.log("✅ [SearchBar] User preferences loaded:", prefs);

        // Update current area display FIRST - this is the most important
        if (prefs.searchAddress) {
          console.log("📍 [SearchBar] Setting displayArea to:", prefs.searchAddress);
          setDisplayArea(prefs.searchAddress);
          
          // Notify parent component if callback provided
          if (onCurrentAreaChange) {
            onCurrentAreaChange(prefs.searchAddress);
            console.log("📍 [SearchBar] Updated parent currentArea to:", prefs.searchAddress);
          }
        }

        // Update location store if coordinates available
        if (prefs.latitude && prefs.longitude) {
          setLocation({
            lat: prefs.latitude,
            lng: prefs.longitude,
            address: prefs.searchAddress || "Saved Location",
          });
          console.log("📍 [SearchBar] Updated location store:", {
            lat: prefs.latitude,
            lng: prefs.longitude,
            address: prefs.searchAddress,
          });
        }

        // If preferences contain province/district/ward IDs, load them
        if (prefs.provinceId) {
          const province = provinces.find(
            (p) => p.value === String(prefs.provinceId)
          );
          if (province) {
            await handleProvinceSelect(province.value, province.label);
          }
        }

        if (prefs.districtId && districts.length > 0) {
          const district = districts.find(
            (d) => d.value === String(prefs.districtId)
          );
          if (district) {
            await handleDistrictSelect(district.value, district.label);
          }
        }

        if (prefs.wardId && wards.length > 0) {
          const ward = wards.find((w) => w.value === String(prefs.wardId));
          if (ward) {
            handleWardSelect(ward.value, ward.label);
          }
        }
      }
      
      // Mark preferences as loaded (whether found or not)
      setPreferencesLoaded(true);
    } catch (error) {
      console.error("❌ [SearchBar] Error loading user preferences:", error);
      // Still mark as loaded even on error
      setPreferencesLoaded(true);
    }
  };
  // Load email notification settings
  const loadEmailNotificationSettings = async () => {
    if (!userId) return;

    try {
      setLoadingEmailNotifications(true);
      console.log(
        "📧 [SearchBar] Loading email notifications for userId:",
        userId
      );

      const result = await getEmailNotifications(userId);
      const emailNotificationsValue = result?.emailNotifications ?? false;

      console.log(
        "📧 [SearchBar] Email notifications:",
        emailNotificationsValue
      );
      setEmailNotifications(emailNotificationsValue);
    } catch (error) {
      console.error("❌ [SearchBar] Error loading email notifications:", error);
      setEmailNotifications(false);
    } finally {
      setLoadingEmailNotifications(false);
    }
  };

  // Toggle email notifications
  const handleEmailNotificationsToggle = async (newValue: boolean) => {
    // console.log("🔔 [SearchBar] Switch toggled! New value:", newValue);
    // console.log("🔔 [SearchBar] Current userId:", userId);

    if (!userId) {
      Toast.show({
        type: "error",
        text1: "Login Required",
        text2: "Please log in to manage email notifications.",
        position: "top",
      });
      return;
    }

    try {
      setLoadingEmailNotifications(true);

      console.log("🔔 [SearchBar] Toggling email notifications to:", newValue);
      console.log("🔔 [SearchBar] User ID:", userId);

      const response = await updateEmailNotifications(userId, newValue);

      console.log(
        "🔔 [SearchBar] Response from updateEmailNotifications:",
        response
      );
      console.log("🔔 [SearchBar] Response type:", typeof response);
      console.log(
        "🔔 [SearchBar] Response.emailNotifications:",
        (response as any)?.emailNotifications
      );

      const updatedValue = response?.emailNotifications ?? newValue;

      console.log("🔔 [SearchBar] Final updatedValue:", updatedValue);

      setEmailNotifications(updatedValue);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Email notifications ${
          updatedValue ? "enabled" : "disabled"
        } successfully!`,
        position: "top",
      });

      console.log(
        "✅ [SearchBar] Email notifications updated successfully to:",
        updatedValue
      );
    } catch (error) {
      console.error(
        "❌ [SearchBar] Error updating email notifications:",
        error
      );
      console.error(
        "❌ [SearchBar] Error details:",
        JSON.stringify(error, null, 2)
      );

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update email notifications. Please try again.",
        position: "top",
      });

      // Revert to previous state on error
      await loadEmailNotificationSettings();
    } finally {
      setLoadingEmailNotifications(false);
    }
  };

  // Save current location as preference (like getCurrentLocation in web)
  const saveUserPreferences = async () => {
    if (!userId) {
      Toast.show({
        type: "error",
        text1: "Login Required",
        text2: "Please log in to save your search preferences.",
        position: "top",
      });
      return;
    }

    setSavingPreferences(true);

    try {
      console.log("📍 [SearchBar] Getting current location to save...");

      // Get current location from device
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2:
            "Please grant location permission to save your current location.",
          position: "top",
        });
        setSavingPreferences(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      console.log("📍 [SearchBar] Current coordinates:", {
        latitude,
        longitude,
      });

      // Reverse geocode to get address from Goong API using the service
      console.log("🔄 [SearchBar] Calling reverseGeocodeCoordinates...");
      const addressData = await reverseGeocodeCoordinates(latitude, longitude);

      if (!addressData || !addressData.formattedAddress) {
        console.error(
          "❌ [SearchBar] No address data returned from reverse geocoding after retries"
        );

        // Show detailed error with option to continue
        Toast.show({
          type: "error",
          text1: "Address Lookup Failed",
          text2: "Using coordinates instead. You can save manually later.",
          position: "top",
          visibilityTime: 4000,
        });

        // Use coordinates as fallback - create a simple address string
        const fallbackAddress = `Location: ${latitude.toFixed(
          6
        )}, ${longitude.toFixed(6)}`;

        const prefsToSave: any = {
          searchAddress: fallbackAddress,
          latitude,
          longitude,
        };

        if (selectedProvince) prefsToSave.provinceId = selectedProvince;
        if (selectedDistrict) prefsToSave.districtId = selectedDistrict;
        if (selectedWard) prefsToSave.wardId = selectedWard;

        setLocation({
          lat: latitude,
          lng: longitude,
          address: fallbackAddress,
        });

        console.log("📍 [SearchBar] Saving with fallback address:", {
          lat: latitude,
          lng: longitude,
          address: fallbackAddress,
        });

        await updateUserPreferences(userId, prefsToSave);

        Toast.show({
          type: "success",
          text1: "Location Saved",
          text2: "Saved using coordinates. Searching nearby rooms...",
          position: "top",
          visibilityTime: 3000,
        });

        setDisplayArea(fallbackAddress);
        if (onCurrentAreaChange) {
          onCurrentAreaChange(fallbackAddress);
        }

        onSearch();
        setSavingPreferences(false);
        return;
      }

      const formattedAddress = addressData.formattedAddress;
      console.log("✅ [SearchBar] Got formatted address:", formattedAddress);

      // Prepare preferences with current location
      const prefsToSave: any = {
        searchAddress: formattedAddress,
        latitude,
        longitude,
      };

      // Add province/district/ward IDs if selected (optional)
      if (selectedProvince) prefsToSave.provinceId = selectedProvince;
      if (selectedDistrict) prefsToSave.districtId = selectedDistrict;
      if (selectedWard) prefsToSave.wardId = selectedWard;

      // Update location store
      setLocation({
        lat: latitude,
        lng: longitude,
        address: formattedAddress,
      });

      console.log("📍 [SearchBar] Saving current location:", {
        lat: latitude,
        lng: longitude,
        address: formattedAddress,
      });

      // Save preferences to backend
      await updateUserPreferences(userId, prefsToSave);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Saved and searching near: ${formattedAddress}`,
        position: "top",
      });
      console.log("✅ [SearchBar] Current location saved successfully");

      // Update display area
      setDisplayArea(formattedAddress);
      if (onCurrentAreaChange) {
        onCurrentAreaChange(formattedAddress);
      }

      // Trigger search to fetch rooms with the saved location
      console.log("🔍 [SearchBar] Triggering room search after save...");
      onSearch();
    } catch (error: any) {
      console.error("❌ [SearchBar] Error saving current location:", error);

      if (error.code === "E_LOCATION_SERVICES_DISABLED") {
        Toast.show({
          type: "error",
          text1: "Location Disabled",
          text2: "Please enable location services.",
          position: "top",
        });
      } else if (error.code === "E_LOCATION_TIMEOUT") {
        Toast.show({
          type: "error",
          text1: "Timeout",
          text2: "Location request timed out. Please try again.",
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to get current location. Please try again.",
          position: "top",
        });
      }
    } finally {
      setSavingPreferences(false);
    }
  };

  // Search by entered address (like handleSave in web)
  const handleSearch = async () => {
    // Build the search address from available inputs
    const addressParts = [];
    if (searchText) addressParts.push(searchText);
    if (wardLabel) addressParts.push(wardLabel);
    if (districtLabel) addressParts.push(districtLabel);
    if (provinceLabel) addressParts.push(provinceLabel);
    const searchAddress = addressParts.join(", ").trim();

    // Require at least some address input
    if (!searchAddress) {
      Toast.show({
        type: "info",
        text1: "No Address",
        text2: "Please enter an address or select a location to search.",
        position: "top",
      });
      return;
    }

    try {
      console.log("🔍 [SearchBar] Searching by address:", searchAddress);

      // Geocode the address to get coordinates using Goong API
      const geoResult = await geocodeAddress(searchAddress);

      if (!geoResult) {
        Toast.show({
          type: "error",
          text1: "Invalid Address",
          text2: "Could not find the address. Please check and try again.",
          position: "top",
        });
        return;
      }

      // Update location store with geocoded coordinates
      // Use the user's entered address instead of formatted address from API
      setLocation({
        lat: geoResult.lat,
        lng: geoResult.lng,
        address: searchAddress, // Keep user's input address
      });

      console.log("📍 [SearchBar] Search coordinates:", {
        lat: geoResult.lat,
        lng: geoResult.lng,
        userEnteredAddress: searchAddress,
      });

      // Update display area with user's entered address (not API's formatted address)
      setDisplayArea(searchAddress);
      if (onCurrentAreaChange) {
        onCurrentAreaChange(searchAddress);
      }

      // Save search address to user preferences if logged in
      if (userId) {
        try {
          const prefsToSave: any = {
            searchAddress: searchAddress,
            latitude: geoResult.lat,
            longitude: geoResult.lng,
          };

          // Add province/district/ward IDs if selected
          if (selectedProvince) prefsToSave.provinceId = selectedProvince;
          if (selectedDistrict) prefsToSave.districtId = selectedDistrict;
          if (selectedWard) prefsToSave.wardId = selectedWard;

          console.log("💾 [SearchBar] Saving search preferences:", prefsToSave);
          await updateUserPreferences(userId, prefsToSave);
          console.log("✅ [SearchBar] Search preferences saved successfully");
        } catch (error) {
          console.error("❌ [SearchBar] Error saving search preferences:", error);
          // Don't block the search if saving fails
        }
      }

      // Trigger search to fetch rooms
      console.log("🔍 [SearchBar] Fetching rooms for searched address...");
      onSearch();

      Toast.show({
        type: "success",
        text1: "Searching",
        text2: `Looking for rooms near: ${searchAddress}`,
        position: "top",
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error("❌ [SearchBar] Error searching by address:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to search. Please try again.",
        position: "top",
      });
    }
  };

  const renderSelectModal = (
    visible: boolean,
    onClose: () => void,
    options: SelectOption[],
    onSelect: (value: string, label: string) => void,
    title: string,
    loading: boolean
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#4A90E2"
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => onSelect(item.value, item.label)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  const navigation = useNavigation<NavigationProp>();

  const onMapPress = () => {
    // Navigate to Map Screen
    navigation.navigate("MapScreen");
  };
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
        <Text style={styles.currentAreaText}>{displayArea}</Text>
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
        <TouchableOpacity style={styles.mapButton} onPress={onMapPress}>
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
            <TouchableOpacity
              style={styles.filterButtonFull}
              onPress={() => setShowProvinceModal(true)}
            >
              <Text style={styles.filterButtonText}>
                {provinceLabel || "Select Province/City"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* District and Ward Row */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterButtonHalf}
              onPress={() => districts.length > 0 && setShowDistrictModal(true)}
              disabled={districts.length === 0}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  districts.length === 0 && styles.disabledText,
                ]}
              >
                {districtLabel || "Select District"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButtonHalf}
              onPress={() => wards.length > 0 && setShowWardModal(true)}
              disabled={wards.length === 0}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  wards.length === 0 && styles.disabledText,
                ]}
              >
                {wardLabel || "Select Ward"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Ionicons name="search" size={16} color="#fff" />
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>

            {userId && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveUserPreferences}
                disabled={savingPreferences}
              >
                {savingPreferences ? (
                  <ActivityIndicator size="small" color="#4A90E2" />
                ) : (
                  <Ionicons name="location" size={16} color="#4A90E2" />
                )}
              </TouchableOpacity>
            )}

            <View style={styles.infoButtonWrapper}>
              <TouchableOpacity
                style={styles.advancedButton}
                onPress={() => setShowInfoPopup(!showInfoPopup)}
              >
                <Ionicons name="information" size={16} color="#666" />
              </TouchableOpacity>

              {/* Info Popup - Float above icon */}
              {showInfoPopup && (
                <>
                  {/* Backdrop overlay to close popup */}
                  <Pressable
                    style={styles.popupBackdrop}
                    onPress={() => setShowInfoPopup(false)}
                  />

                  {/* Popup content */}
                  <View style={styles.infoPopup}>
                    <View style={styles.infoPopupContent}>
                      <View style={styles.infoPopupHeader}>
                        <Text style={styles.infoPopupTitleText}>
                          ℹ️ Search Area Info
                        </Text>
                        <TouchableOpacity
                          onPress={() => setShowInfoPopup(false)}
                        >
                          <Ionicons name="close" size={18} color="#666" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.infoPopupBody}>
                        <Text style={styles.infoPopupLabel}>Current Area:</Text>
                        <Text style={styles.infoPopupValue}>{displayArea}</Text>

                        <Text style={styles.infoPopupDescription}>
                          {`You can:\n• Use the 📍 button to save your current GPS location\n• Use the 🔍 Search button to search by address\n• The system will find rooms near your saved location`}
                        </Text>
                      </View>
                    </View>
                    {/* Triangle pointer */}
                    <View style={styles.infoPopupArrow} />
                  </View>
                </>
              )}
            </View>

            <View style={styles.emailButtonWrapper}>
              <TouchableOpacity
                style={[
                  styles.emailButton,
                  emailNotifications && styles.emailButtonActive,
                ]}
                onPress={() => setShowEmailPopup(!showEmailPopup)}
                disabled={!userId}
              >
                <Ionicons
                  name={emailNotifications ? "mail" : "mail-outline"}
                  size={16}
                  color={emailNotifications ? "#4A90E2" : "#666"}
                />
              </TouchableOpacity>

              {/* Email Notifications Popup - Float above icon */}
              {showEmailPopup && userId && (
                <>
                  {/* Backdrop overlay to close popup */}
                  <Pressable
                    style={styles.popupBackdrop}
                    onPress={() => setShowEmailPopup(false)}
                  />

                  {/* Popup content */}
                  <View style={styles.emailPopup}>
                    <View style={styles.emailPopupContent}>
                      <View style={styles.emailPopupHeader}>
                        <Text style={styles.emailPopupTitleText}>
                          📧 Email Notifications
                        </Text>
                        <TouchableOpacity
                          onPress={() => setShowEmailPopup(false)}
                        >
                          <Ionicons name="close" size={18} color="#666" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.emailSwitchRow}>
                        <Text style={styles.emailSwitchLabel}>
                          {emailNotifications ? "Enabled" : "Disabled"}
                        </Text>
                        {loadingEmailNotifications ? (
                          <ActivityIndicator size="small" color="#4A90E2" />
                        ) : (
                          <Switch
                            value={emailNotifications}
                            onValueChange={handleEmailNotificationsToggle}
                            disabled={loadingEmailNotifications || !userId}
                            trackColor={{ false: "#D1D5DB", true: "#4A90E2" }}
                            thumbColor={emailNotifications ? "#fff" : "#f4f3f4"}
                            ios_backgroundColor="#D1D5DB"
                          />
                        )}
                      </View>
                    </View>
                    {/* Triangle pointer */}
                    <View style={styles.emailPopupArrow} />
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Modals */}
      {renderSelectModal(
        showProvinceModal,
        () => setShowProvinceModal(false),
        provinces,
        handleProvinceSelect,
        "Select Province/City",
        loadingProvinces
      )}

      {renderSelectModal(
        showDistrictModal,
        () => setShowDistrictModal(false),
        districts,
        handleDistrictSelect,
        "Select District",
        loadingDistricts
      )}

      {renderSelectModal(
        showWardModal,
        () => setShowWardModal(false),
        wards,
        handleWardSelect,
        "Select Ward",
        loadingWards
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
    overflow: "visible",
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
    overflow: "visible",
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
  saveButton: {
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
    borderWidth: 1,
    borderColor: "#4A90E2",
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
  messageButtonActive: {
    backgroundColor: "#E8F2FF",
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  disabledText: {
    color: "#ccc",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    maxHeight: "80%",
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: "#333",
  },
  loader: {
    padding: spacing.xl,
  },
  modalItem: {
    padding: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  modalItemText: {
    fontSize: fontSize.base,
    color: "#333",
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  emailButton: {
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
  emailButtonActive: {
    backgroundColor: "#E8F2FF",
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  emailButtonWrapper: {
    position: "relative",
  },
  popupBackdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: "transparent",
    zIndex: 999,
  },
  emailPopup: {
    position: "absolute",
    bottom: normalize(44),
    right: 0,
    minWidth: normalize(240),
    zIndex: 1000,
  },
  emailPopupContent: {
    backgroundColor: "#fff",
    borderRadius: normalize(8),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: normalize(8),
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
  },
  emailPopupArrow: {
    position: "absolute",
    bottom: normalize(-6),
    right: normalize(12),
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
  },
  emailPopupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  emailPopupTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  emailPopupTitleText: {
    fontSize: fontSize.sm,
    color: "#333",
    fontWeight: "600",
  },
  emailPopupBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  emailPopupDescription: {
    fontSize: fontSize.sm,
    color: "#666",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emailSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  emailSwitchLabel: {
    fontSize: fontSize.sm,
    color: "#333",
    fontWeight: "500",
  },
  // Info popup styles
  infoButtonWrapper: {
    position: "relative",
  },
  infoPopup: {
    position: "absolute",
    bottom: normalize(44),
    right: 0,
    minWidth: normalize(280),
    maxWidth: normalize(320),
    zIndex: 1000,
  },
  infoPopupContent: {
    backgroundColor: "#fff",
    borderRadius: normalize(8),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: normalize(8),
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
  },
  infoPopupArrow: {
    position: "absolute",
    bottom: normalize(-6),
    right: normalize(12),
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
  },
  infoPopupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoPopupTitleText: {
    fontSize: fontSize.sm,
    color: "#333",
    fontWeight: "600",
  },
  infoPopupBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  infoPopupLabel: {
    fontSize: fontSize.xs,
    color: "#4A90E2",
    fontWeight: "600",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  infoPopupValue: {
    fontSize: fontSize.sm,
    color: "#333",
    fontWeight: "500",
    marginBottom: spacing.md,
  },
  infoPopupDescription: {
    fontSize: fontSize.sm,
    color: "#666",
    lineHeight: 20,
  },
});

export default SearchBar;
