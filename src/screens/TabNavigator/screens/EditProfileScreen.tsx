import { yupResolver } from "@hookform/resolvers/yup";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  FlatList,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Feather";
import * as yup from "yup";
import useAuthStore from "../../../Stores/useAuthStore";
import { RootStackParamList } from "../../StackNavigator";
import { URL_IMAGE } from "../../../Services/Constants";
import { District, Province, Ward } from "../../../types/types";
import {
  getDistricts,
  getProvinces,
  getWards,
} from "../../../Services/AddressService";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfileScreen">;

// Validation schema
const schema = yup.object({
  fullName: yup
    .string()
    .required("Full name is required")
    .min(2, "Full name must be at least 2 characters"),
  phoneNumber: yup
    .string()
    .required("Phone number is required")
    .matches(/^[0-9]{10,11}$/, "Phone number must be 10-11 digits"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
  province: yup.string().required("Province is required"),
  district: yup.string().required("District is required"),
  ward: yup.string().required("Ward is required"),
  address: yup.string().required("Address is required"),
});

type FormData = yup.InferType<typeof schema>;

const EditProfileScreen = ({ navigation, route }: Props) => {
  const authStore = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);

  useEffect(() => {
    // Fetch provinces when component mounts
    const fetchProvinces = async () => {
      try {
        const response = await getProvinces();
        const data = response.data || response;
        setProvinces(data as Province[]);
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
      }
    };

    fetchProvinces();
  }, []);

  const fetchDistricts = async (provinceId: string) => {
    try {
      const response = await getDistricts(provinceId);
      const data = response.data || response;
      setDistricts(data as District[]);
    } catch (error) {
      console.error("Failed to fetch districts:", error);
    }
  };

  const fetchWards = async (districtId: string) => {
    try {
      const response = await getWards(districtId);
      const data = response.data || response;
      setWards(data as Ward[]);
    } catch (error) {
      console.error("Failed to fetch wards:", error);
    }
  };

  // Dropdown selection handlers
  const handleProvinceSelect = (province: Province) => {
    setValue("province", province.name);
    setValue("district", ""); // Reset district
    setValue("ward", ""); // Reset ward
    setDistricts([]);
    setWards([]);
    fetchDistricts(province.id.toString());
  };

  const handleDistrictSelect = (district: District) => {
    setValue("district", district.name);
    setValue("ward", ""); // Reset ward
    setWards([]);
    fetchWards(district.id.toString());
  };

  const handleWardSelect = (ward: Ward) => {
    setValue("ward", ward.name);
  };

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });

  // Load user data when component mounts
  useEffect(() => {
    const userProfile =
      route.params?.userProfile || authStore.loggedInUser?.userProfile;
    if (userProfile) {
      const profile = userProfile as any; // Cast to any to avoid type issues
      setValue("fullName", profile.fullName || "");
      setValue("phoneNumber", profile.phoneNumber || "");
      setValue("email", profile.email || "");
      setValue("address", profile.address?.street || "");
      setValue(
        "province",
        profile.address?.ward?.district?.province?.name || ""
      );
      setValue("district", profile.address?.ward?.district?.name || "");
      setValue("ward", profile.address?.ward?.name || "");
    }
  }, [route.params?.userProfile, authStore.loggedInUser, setValue]);

  const showToast = (
    type: "success" | "error",
    title: string,
    message: string
  ) => {
    Toast.show({
      type: type,
      position: "top",
      text1: title,
      text2: message,
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
      bottomOffset: 40,
      props: {
        style: {
          borderLeftColor: type === "success" ? "#10B981" : "#FF392B",
          borderLeftWidth: 4,
          backgroundColor:
            type === "success"
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(255, 57, 43, 0.1)",
        },
        contentContainerStyle: {
          paddingHorizontal: 15,
        },
        text1Style: {
          fontSize: 16,
          fontWeight: "600",
          color: type === "success" ? "#10B981" : "#FF392B",
        },
        text2Style: {
          fontSize: 14,
          color: type === "success" ? "#10B981" : "#FF392B",
        },
      },
    });
  };

  const onSubmit = async (data: FormData) => {
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      // Here you would call your API to update profile
      console.log("Updating profile with data:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast("success", "Success", "Profile updated successfully");
      navigation.goBack();
    } catch (error: any) {
      console.error("Update profile error:", error);
      showToast(
        "error",
        "Update Failed",
        error.message || "Failed to update profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleUploadImage = () => {
    // Handle image upload logic
    console.log("Upload image pressed");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Icon name="x" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Personal Information</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {route.params?.userProfile?.avatar ? (
              <Image
                source={{
                  uri: URL_IMAGE + (route.params?.userProfile?.avatar || ""),
                }} // Replace with actual avatar
                style={styles.avatar}
              />
            ) : (
              <Icon name="user" size={128} color="#64748b" />
            )}
          </View>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadImage}
          >
            <Icon name="upload" size={16} color="#64748b" />
            <Text style={styles.uploadText}>Upload Image</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Text style={styles.required}>* </Text>Full Name
            </Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.inputContainer}>
                  <Icon
                    name="user"
                    size={16}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, errors.fullName && styles.inputError]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName.message}</Text>
            )}
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.inputContainer}>
                  <Icon
                    name="phone"
                    size={16}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      errors.phoneNumber && styles.inputError,
                    ]}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                  />
                </View>
              )}
            />
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Text style={styles.required}>* </Text>Email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.inputContainer}>
                  <Icon
                    name="mail"
                    size={16}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Location Section */}
          <View style={styles.locationSection}>
            {/* Province and District Row */}
            <View style={styles.locationRow}>
              {/* Province */}
              <View style={styles.locationItem}>
                <Text style={styles.inputLabel}>Province</Text>
                <Controller
                  control={control}
                  name="province"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdown,
                        errors.province && styles.inputError,
                      ]}
                      onPress={() => setShowProvinceModal(true)}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          !value && styles.placeholderText,
                        ]}
                      >
                        {value || "Select Province"}
                      </Text>
                      <Icon name="chevron-down" size={16} color="#64748b" />
                    </TouchableOpacity>
                  )}
                />
                {errors.province && (
                  <Text style={styles.errorText}>
                    {errors.province.message}
                  </Text>
                )}
              </View>

              {/* District */}
              <View style={styles.locationItem}>
                <Text style={styles.inputLabel}>District</Text>
                <Controller
                  control={control}
                  name="district"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdown,
                        errors.district && styles.inputError,
                      ]}
                      onPress={() => setShowDistrictModal(true)}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          !value && styles.placeholderText,
                        ]}
                      >
                        {value || "Select District"}
                      </Text>
                      <Icon name="chevron-down" size={16} color="#64748b" />
                    </TouchableOpacity>
                  )}
                />
                {errors.district && (
                  <Text style={styles.errorText}>
                    {errors.district.message}
                  </Text>
                )}
              </View>
            </View>

            {/* Ward Row - Full Width */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ward</Text>
              <Controller
                control={control}
                name="ward"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TouchableOpacity
                    style={[styles.dropdown, errors.ward && styles.inputError]}
                    onPress={() => setShowWardModal(true)}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        !value && styles.placeholderText,
                      ]}
                    >
                      {value || "Select Ward"}
                    </Text>
                    <Icon name="chevron-down" size={16} color="#64748b" />
                  </TouchableOpacity>
                )}
              />
              {errors.ward && (
                <Text style={styles.errorText}>{errors.ward.message}</Text>
              )}
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[
                    styles.input,
                    styles.addressInput,
                    errors.address && styles.inputError,
                  ]}
                  placeholder="Enter your address"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                />
              )}
            />
            {errors.address && (
              <Text style={styles.errorText}>{errors.address.message}</Text>
            )}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  placeholder: {
    width: 32,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  required: {
    color: "#ef4444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#374151",
  },
  addressInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  dropdownText: {
    fontSize: 14,
    color: "#374151",
  },
  placeholderText: {
    color: "#9ca3af",
  },
  locationSection: {
    gap: 16,
  },
  locationRow: {
    flexDirection: "row",
    gap: 12,
  },
  locationItem: {
    flex: 1,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default EditProfileScreen;
