import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  fontSize,
  layout,
  normalize,
  spacing,
} from "../../../utils/responsive";

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
      icon: "document-text",
      screen: "MyContractsScreen",
      description: "View and manage your rental contracts",
    },
    {
      id: "2",
      title: "Rental History",
      icon: "time",
      screen: "RentalHistoryScreen",
      description: "Check your past rental records",
    },
    {
      id: "3",
      title: "Request Status",
      icon: "clipboard",
      screen: "RequestStatusScreen",
      description: "Track your rental requests",
    },
    {
      id: "4",
      title: "Residents",
      icon: "people",
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
      <View style={styles.menuIconContainer}>
        <Ionicons name={item.icon} size={24} color="#4A90E2" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage</Text>
        <Text style={styles.headerSubtitle}>
          Control your rental activities
        </Text>
      </View>

      <View style={styles.menuContainer}>{menuItems.map(renderMenuItem)}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: "#333",
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: "#666",
  },
  menuContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: normalize(12),
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: normalize(4),
    elevation: 3,
  },
  menuIconContainer: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: "#333",
    marginBottom: spacing.xs,
  },
  menuDescription: {
    fontSize: fontSize.sm,
    color: "#666",
    lineHeight: 18,
  },
});

export default ManageScreen;
