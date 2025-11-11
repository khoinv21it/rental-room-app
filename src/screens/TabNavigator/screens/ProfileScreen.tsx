import React, { use, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import Toast from "react-native-toast-message";
import useAuthStore from "../../../Stores/useAuthStore";
import { UserProfile } from "../../../types/types";
import { getUserProfile } from "../../../Services/ProfileService";
import { changePassword } from "../../../Services/Auth";
import { URL_IMAGE } from "../../../Services/Constants";

type Props = {
  navigation: any;
};

const ProfileScreen = ({ navigation }: Props) => {
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(
    null
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const authStore = useAuthStore();

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

  useEffect(() => {
    // Fetch user profile from your store or API
    const fetchUserProfile = async () => {
      try {
        if (authStore.loggedInUser?.userProfile?.id) {
          const response = await getUserProfile(
            authStore.loggedInUser.userProfile.id
          );

          // Try different ways to access the data
          let profileData = null;
          if (response?.data) {
            profileData = response.data;
          } else if (response) {
            profileData = response;
          }

          if (profileData) {
            setUserProfile(profileData as UserProfile);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Fallback to store data if API fails
        if (authStore.loggedInUser?.userProfile) {
          setUserProfile(authStore.loggedInUser.userProfile as UserProfile);
        }
      }
    };

    fetchUserProfile();
  }, [authStore.loggedInUser]);

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    navigation.navigate("EditProfileScreen", {
      userProfile: userProfile || authStore.loggedInUser?.userProfile,
    });
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    // Dismiss keyboard first
    Keyboard.dismiss();

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast("error", "Validation Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(
        "error",
        "Validation Error",
        "New password and confirm password do not match"
      );
      return;
    }

    if (newPassword.length < 6) {
      showToast(
        "error",
        "Validation Error",
        "New password must be at least 6 characters"
      );
      return;
    }

    try {
      console.log("pass" + oldPassword, newPassword);
      const response = await changePassword(
        authStore.loggedInUser?.id || "",
        oldPassword,
        newPassword
      );
      console.log("Change password response:", response);

      // Since apiClient returns response.data directly, response is the actual data
      const data = response as any;

      // Check if we have data
      if (!data) {
        showToast("error", "Server Error", "Invalid response from server");
        return;
      }

      // Success case: response has message and no error field
      if (data.message && !data.error) {
        // Reset form
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordModal(false);

        showToast("success", "Success", data.message);
        return;
      }

      // Error case: response has error field (from 400 status)
      if (data.error) {
        let errorMessage = "Failed to change password";

        if (Array.isArray(data.message)) {
          errorMessage = data.message[0]; // Get first error message
        } else if (data.message) {
          errorMessage = data.message;
        }

        showToast("error", "Change Password Failed", errorMessage);
        return;
      }

      // Fallback case - if we reach here, something unexpected happened
      console.log("Unexpected response format:", data);
      showToast("error", "Unexpected Error", "Unexpected response format");
    } catch (error: any) {
      console.error("Change password error:", error);

      // Handle network errors or other exceptions
      let errorMessage = "Failed to change password";

      if (error?.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message[0];
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showToast("error", "Change Password Failed", errorMessage);
    }
  };

  const handleCloseModal = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(false);
  };

  const handleSignOut = async () => {
    try {
      await authStore.logOut();
      // Reset navigation stack và chuyển về Login
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginScreen" }],
      });
      console.log("Sign out successful");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              {userProfile?.avatar ? (
                <Image
                  source={{ uri: URL_IMAGE + userProfile?.avatar }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : (
                <Icon name="user" size={32} color="#64748b" />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userProfile?.fullName ||
                  authStore.loggedInUser?.userProfile?.fullName ||
                  "No name"}
              </Text>
              <Text style={styles.userEmail}>
                {userProfile?.email || "No email"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Icon name="edit-2" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Information Cards */}
        <View style={styles.infoContainer}>
          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.fieldGroup}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <Text style={[styles.fieldValue, styles.emptyValue]}>
                  {userProfile?.phoneNumber || "Not added yet"}
                </Text>
              </View>
              <View style={styles.fieldSeparator} />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Address</Text>
                <Text style={[styles.fieldValue, styles.emptyValue]}>
                  {userProfile?.address
                    ? `${userProfile.address.street}, ${userProfile.address.ward.name}, ${userProfile.address.ward.district.name}, ${userProfile.address.ward.district.province.name}`
                    : "Not added yet"}
                </Text>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.fieldGroup}>
              <TouchableOpacity
                style={styles.actionField}
                onPress={handleChangePassword}
              >
                <View style={styles.actionContent}>
                  <Icon name="lock" size={16} color="#64748b" />
                  <Text style={styles.actionLabel}>Change Password</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#cbd5e1" />
              </TouchableOpacity>
              <View style={styles.fieldSeparator} />
              <TouchableOpacity style={styles.actionField}>
                <View style={styles.actionContent}>
                  <Icon name="bell" size={16} color="#64748b" />
                  <Text style={styles.actionLabel}>Notifications</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#cbd5e1" />
              </TouchableOpacity>
              <View style={styles.fieldSeparator} />
              <TouchableOpacity
                style={styles.actionField}
                onPress={handleSignOut}
              >
                <View style={styles.actionContent}>
                  <Icon name="log-out" size={16} color="#ef4444" />
                  <Text style={[styles.actionLabel, styles.dangerText]}>
                    Sign Out
                  </Text>
                </View>
                <Icon name="chevron-right" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            {/* Old Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Old Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your old password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showOldPassword}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowOldPassword(!showOldPassword)}
                >
                  <Icon
                    name={showOldPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotLink}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon
                    name={showNewPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your confirm new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={showConfirmPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSavePassword}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#0f172a",
    letterSpacing: -0.025,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 24,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoContainer: {
    gap: 16,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  fieldGroup: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  field: {
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "400",
  },
  emptyValue: {
    color: "#94a3b8",
    fontStyle: "italic",
  },
  fieldSeparator: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: -16,
  },
  actionField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionLabel: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "400",
    marginLeft: 12,
  },
  dangerText: {
    color: "#ef4444",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#374151",
  },
  eyeButton: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  forgotText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default ProfileScreen;
