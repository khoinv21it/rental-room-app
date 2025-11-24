import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  fontSize,
  layout,
  normalize,
  spacing,
} from "../../../utils/responsive";

const { width } = Dimensions.get("window");

type Props = {
  navigation: any;
};

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
  description: string;
}

const ManageScreen = ({ navigation }: Props) => {
  const menuItems: MenuItem[] = [
    {
      id: "1",
      title: "My Contracts",
      icon: "document-text-outline",
      screen: "MyContractsScreen",
      description: "View and manage your rental contracts",
    },
    {
      id: "2",
      title: "Rental History",
      icon: "time-outline",
      screen: "RentalHistoryScreen",
      description: "Check your past rental records",
    },
    {
      id: "3",
      title: "Request Status",
      icon: "clipboard-outline",
      screen: "RequestStatusScreen",
      description: "Track your rental requests",
    },
    {
      id: "4",
      title: "Residents",
      icon: "people-outline",
      screen: "ResidentsScreen",
      description: "Manage resident information",
    },
  ];

  const handleMenuPress = (screen: string) => {
    console.log(`Navigate to ${screen}`);
    navigation.navigate(screen);
  };

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleMenuPress(item.screen)}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, getIconColor(item.id)]}>
        <Ionicons name={item.icon} size={28} color="#fff" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuDescription}>{item.description}</Text>
      </View>
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  const getIconColor = (id: string) => {
    const colors: { [key: string]: any } = {
      "1": styles.iconBlue,
      "2": styles.iconPurple,
      "3": styles.iconOrange,
      "4": styles.iconGreen,
    };
    return colors[id] || styles.iconBlue;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Modern Header */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Manage</Text>
              <Text style={styles.headerSubtitle}>
                Control your rental activities
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="settings-outline" size={24} color="#4A90E2" />
            </View>
          </View>
        </View>
      </View>

      {/* Menu Section */}
      <View style={styles.menuSection}>
        <View style={styles.menuContainer}>
          {menuItems.map(renderMenuItem)}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  // Header Styles
  headerGradient: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: normalize(24),
    borderBottomRightRadius: normalize(24),
    shadowColor: "#4A90E2",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: normalize(8),
    elevation: 5,
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fontSize["3xl"],
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.base,
    color: "#6B7280",
    fontWeight: "500",
  },
  headerIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  // Menu Section
  menuSection: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  menuContainer: {
    gap: spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: normalize(20),
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: normalize(15),
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  menuIconContainer: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(18),
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.lg,
  },
  iconBlue: {
    backgroundColor: "#4A90E2",
  },
  iconPurple: {
    backgroundColor: "#9333EA",
  },
  iconOrange: {
    backgroundColor: "#F59E0B",
  },
  iconGreen: {
    backgroundColor: "#22C55E",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  menuDescription: {
    fontSize: fontSize.sm,
    color: "#6B7280",
    lineHeight: 20,
    fontWeight: "400",
  },
  arrowContainer: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ManageScreen;
