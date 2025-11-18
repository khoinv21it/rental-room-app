import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface MapMarkerProps {
  price: number;
  isVip?: boolean;
}

const MapMarker: React.FC<MapMarkerProps> = ({ price, isVip = false }) => {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    return `${(price / 1000).toFixed(0)}K`;
  };

  return (
    <View style={styles.outerContainer}>
      <View
        style={[styles.bubble, isVip ? styles.vipBubble : styles.normalBubble]}
      >
        <Text style={[styles.priceText, isVip && styles.vipPriceText]}>
          {formatPrice(price)} đ
        </Text>
        {isVip && <Text style={styles.vipLabel}>VIP</Text>}
      </View>
      <View style={[styles.tail, isVip ? styles.vipTail : styles.normalTail]} />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "red",
    width: 200,
    height: 50,
  },
  bubble: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  normalBubble: {
    backgroundColor: "#FF6B35",
  },
  vipBubble: {
    backgroundColor: "#FFD700",
  },
  priceText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
  },
  vipPriceText: {
    color: "#333",
  },
  vipLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#333",
    marginTop: 1,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
  normalTail: {
    borderTopColor: "#FF6B35",
  },
  vipTail: {
    borderTopColor: "#FFD700",
  },
});

export default MapMarker;
