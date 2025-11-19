import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
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
import { db } from "../../../lib/firebase";
import { changePassword } from "../../../Services/Auth";
import { URL_IMAGE } from "../../../Services/Constants";
import { getUserProfile } from "../../../Services/ProfileService";
import useAuthStore from "../../../Stores/useAuthStore";
import { UserProfile } from "../../../types/types";

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
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
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

  // Listen to unread notifications count
  useEffect(() => {
    const userId = authStore.loggedInUser?.id;
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("receiverId", "==", userId),
      where("isRead", "==", false)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.length;
      setUnreadNotificationCount(count);
    });

    return () => unsub();
  }, [authStore.loggedInUser?.id]);

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    navigation.navigate("EditProfileScreen", {
      userProfile: userProfile || authStore.loggedInUser?.userProfile,
      onProfileUpdated: (updatedProfile: UserProfile) => {
        setUserProfile(updatedProfile);
        authStore.updateUserProfile(updatedProfile);
      },
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header with Gradient */}
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>
              Manage your account settings
            </Text>
          </View>
        </View>

        {/* Profile Card - Modern Design */}
        <View style={styles.profileCard}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                {userProfile?.avatar ? (
                  <Image
                    source={{ uri: URL_IMAGE + userProfile?.avatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Icon name="user" size={40} color="#3B82F6" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editAvatarButton}
                  onPress={handleEditProfile}
                >
                  <Icon name="camera" size={14} color="#fff" />
                </TouchableOpacity>
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
              <Icon name="edit-2" size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Information Cards */}
        <View style={styles.infoContainer}>
          {/* Contact Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Icon name="phone" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>
            <View style={styles.fieldGroup}>
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Icon name="phone" size={14} color="#6B7280" />
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                </View>
                <Text
                  style={[
                    styles.fieldValue,
                    !userProfile?.phoneNumber && styles.emptyValue,
                  ]}
                >
                  {userProfile?.phoneNumber || "Not added yet"}
                </Text>
              </View>
              <View style={styles.fieldSeparator} />
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Icon name="map-pin" size={14} color="#6B7280" />
                  <Text style={styles.fieldLabel}>Address</Text>
                </View>
                <Text
                  style={[
                    styles.fieldValue,
                    !userProfile?.address && styles.emptyValue,
                  ]}
                >
                  {userProfile?.address
                    ? `${userProfile.address.street}, ${userProfile.address.ward.name}, ${userProfile.address.ward.district.name}, ${userProfile.address.ward.district.province.name}`
                    : "Not added yet"}
                </Text>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Icon name="settings" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>Settings & Actions</Text>
            </View>
            <View style={styles.fieldGroup}>
              <TouchableOpacity
                style={styles.actionField}
                onPress={handleChangePassword}
                activeOpacity={0.7}
              >
                <View style={styles.actionContent}>
                  <View style={styles.actionIconContainer}>
                    <Icon name="lock" size={18} color="#3B82F6" />
                  </View>
                  <Text style={styles.actionLabel}>Change Password</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>
              <View style={styles.fieldSeparator} />
              <TouchableOpacity
                style={styles.actionField}
                onPress={() => navigation.navigate("NotificationScreen")}
                activeOpacity={0.7}
              >
                <View style={styles.actionContent}>
                  <View style={styles.actionIconContainer}>
                    <View style={styles.notificationIconWrapper}>
                      <Icon name="bell" size={18} color="#F59E0B" />
                      {unreadNotificationCount > 0 && (
                        <View style={styles.notificationBadge}>
                          <Text style={styles.notificationBadgeText}>
                            {unreadNotificationCount > 99
                              ? "99+"
                              : unreadNotificationCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.actionLabel}>Notifications</Text>
                  {unreadNotificationCount > 0 && (
                    <View style={styles.unreadCountBadge}>
                      <Text style={styles.unreadCountText}>
                        {unreadNotificationCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Icon name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>
              <View style={styles.fieldSeparator} />
              <TouchableOpacity
                style={styles.actionField}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <View style={styles.actionContent}>
                  <View
                    style={[
                      styles.actionIconContainer,
                      styles.dangerIconContainer,
                    ]}
                  >
                    <Icon name="log-out" size={18} color="#EF4444" />
                  </View>
                  <Text style={[styles.actionLabel, styles.dangerText]}>
                    Sign Out
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#FECACA" />
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
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Modern Header - Compacted
  headerGradient: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Profile Card - Compacted
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 10,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#DBEAFE",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  userEmail: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  editButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  // Info Container - Compacted
  infoContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
    letterSpacing: 0.2,
  },
  fieldGroup: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  field: {
    paddingVertical: 10,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 6,
  },
  fieldValue: {
    fontSize: 14,
    color: "#1A1A2E",
    fontWeight: "500",
    lineHeight: 20,
  },
  emptyValue: {
    color: "#9CA3AF",
    fontStyle: "italic",
    fontWeight: "400",
  },
  fieldSeparator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: -16,
  },
  actionField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dangerIconContainer: {
    backgroundColor: "#FEF2F2",
  },
  actionLabel: {
    fontSize: 14,
    color: "#1A1A2E",
    fontWeight: "600",
    flex: 1,
  },
  dangerText: {
    color: "#EF4444",
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
  notificationIconWrapper: {
    position: "relative",
    marginRight: 12,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
  },
  unreadCountBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  unreadCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});

export default ProfileScreen;
