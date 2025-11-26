import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import {
  NavigationProp,
  ParamListBase,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import {
  fetchFavoriteRooms,
  fetchAndUpdateFavorites,
  addFavorite,
  removeFavorite,
} from "../../../Services/FavoriteService";
import useFavoriteStore from "../../../Stores/useFavoriteStore";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { API_URL, URL_IMAGE } from "../../../Services/Constants";

type Props = { navigation: any };

const RoomCard = ({ item, isFavorite, onToggle }: any) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const handleOpenRoomDetail = (roomId: string) => {
    navigation.navigate("RoomDetailScreen", { roomId });
  };
  const getAvatarSrc = (avatar?: any) => {
    // accept string, object like {url,path,uri}, or array
    if (!avatar) return null;
    let a: any = avatar;
    if (Array.isArray(a) && a.length > 0) a = a[0];
    if (typeof a === "object") {
      a = a.url || a.path || a.uri || a.href || null;
    }
    if (!a || typeof a !== "string") return null;

    if (a.startsWith("/dmvvs0ags/") || a.startsWith("dmvvs0ags/"))
      return `${URL_IMAGE}${a}`;
    if (a.startsWith("http")) return a;
    // relative path
    const base = API_URL.replace(/\/api\/?$/, "");
    if (a.startsWith("/")) return `${base}${a}`;
    return `${base}/${a}`;
  };

  const conveniences = (item?.conveniences || [])
    .map((c: any) => (typeof c === "string" ? c : c?.name))
    .filter(Boolean);
  const showConveniences = conveniences.slice(0, 3);
  const moreConveniences = conveniences.length - showConveniences.length;

  // small helper to prettify labels
  const fmtLabel = (s: string) =>
    String(s)
      .replace(/[_-]/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const chipPalette: Record<
    string,
    { bg: string; color: string; icon: string }
  > = {
    kitchen: { bg: "#fffbeb", color: "#92400e", icon: "silverware" },
    kitchen_shelf: { bg: "#fffbeb", color: "#92400e", icon: "cupboard" },
    garage: { bg: "#ecfeff", color: "#0f766e", icon: "garage" },
    wifi: { bg: "#eef2ff", color: "#3730a3", icon: "wifi" },
    air_conditioner: {
      bg: "#f0f9ff",
      color: "#0369a1",
      icon: "air-conditioner",
    },
    default: { bg: "#f8fafc", color: "#334155", icon: "checkbox-blank-circle" },
  };

  const renderConvenience = (c: string, idx: number) => {
    const key = (c || "").toString();
    const pal = chipPalette[key] || chipPalette.default;
    return (
      <View
        key={idx}
        style={[
          styles.chipSmall,
          {
            backgroundColor: pal.bg,
            borderColor: pal.bg === "#f8fafc" ? "#e6eef7" : "transparent",
          },
        ]}
      >
        <Icon name={pal.icon as any} size={12} color={pal.color} />
        <Text
          style={[styles.chipTextSmall, { color: pal.color, marginLeft: 6 }]}
        >
          {fmtLabel(key)}
        </Text>
      </View>
    );
  };

  const landlord = item?.landlord;
  const landlordProfile =
    landlord?.landlordProfile ||
    landlord?.profile ||
    landlord?.userProfile ||
    {};
  const landlordName =
    landlordProfile?.fullName ||
    landlordProfile?.name ||
    landlord?.name ||
    "Owner";
  const contactInfo = landlordProfile?.phoneNumber || landlordProfile?.email;

  // Resolve avatar from multiple possible places (matches backend examples)
  const avatarPath =
    landlordProfile?.avatar ||
    landlordProfile?.avatarPath ||
    landlord?.userProfile?.avatar ||
    landlord?.avatar ||
    null;

  // Do NOT use session user avatar here — avatar belongs to the landlord.
  // getAvatarSrc will normalize objects like {url: '/path'} automatically

  // derive initials from the landlord name to show when no avatar image is available
  const landlordInitials = (landlordName || "")
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const landlordAvatarSrc = getAvatarSrc(avatarPath);
  const landlordAvatarUri = landlordAvatarSrc
    ? { uri: landlordAvatarSrc }
    : null;

  const formatAddress = (addr: any) => {
    if (!addr) return "No address";
    if (typeof addr === "string") return addr;
    // try nested structure like web: address.street, address.ward.name, ward.district.name, province.name
    const parts: string[] = [];
    if (addr.street) parts.push(addr.street);
    if (addr.ward && typeof addr.ward === "string") parts.push(addr.ward);
    if (addr.ward && typeof addr.ward === "object" && addr.ward.name)
      parts.push(addr.ward.name);
    if (addr.ward && addr.ward.district && addr.ward.district.name)
      parts.push(addr.ward.district.name);
    if (
      addr.ward &&
      addr.ward.district &&
      addr.ward.district.province &&
      addr.ward.district.province.name
    )
      parts.push(addr.ward.district.province.name);
    if (addr.district && typeof addr.district === "string")
      parts.push(addr.district);
    if (addr.city) parts.push(addr.city);
    if (parts.length) return parts.join(", ");
    if (addr.name) return String(addr.name);
    try {
      return JSON.stringify(addr);
    } catch {
      return "No address";
    }
  };

  const formatPrice = (p: any) => {
    if (p == null) return null; // don't show 'Contact' text
    if (typeof p === "number" || typeof p === "string") return `${p} đ`;
    // if object like { amount, currency }
    if (typeof p === "object") {
      if (p.amount) return `${p.amount}${p.unit ? " " + p.unit : " đ"}`;
      if (p.price) return `${p.price} đ`;
    }
    return String(p);
  };

  // Build image URL from images array like web source
  const buildImageUrl = (img: any) => {
    if (!img) return null;
    const url = img.url || img.path || img;
    if (!url) return null;
    if (typeof url !== "string") return null;
    if (url.startsWith("http")) return url;

    // Cloudinary stored paths use a special prefix in web code
    if (url.startsWith("/dmvvs0ags/") || url.startsWith("dmvvs0ags/")) {
      return `${URL_IMAGE}${url}`;
    }

    // If path starts with slash, prefix with API base (remove trailing /api)
    const base = API_URL.replace(/\/api\/?$/, "");
    if (url.startsWith("/")) return `${base}${url}`;
    return `${base}/${url}`;
  };

  const firstImage =
    Array.isArray(item?.images) && item.images.length > 0
      ? buildImageUrl(item.images[0])
      : null;
  const uri = firstImage ? { uri: firstImage } : null;
  const imageCount = Array.isArray(item?.images) ? item.images.length : 0;

  // Extract some common fields that source-web shows (area, beds, isVip)
  const area = item?.area || item?.size || item?.acreage;
  const beds = item?.beds || item?.bedrooms || item?.roomNumber;
  const isVip = !!item?.isVip || !!item?.vip;

  // open address in maps (uses coords if available)
  const openMap = async () => {
    const addrObj = item?.address;
    const formatted = formatAddress(addrObj);
    // try common coordinate keys
    const lat =
      addrObj?.lat ??
      addrObj?.latitude ??
      addrObj?.latlng?.lat ??
      addrObj?.location?.lat;
    const lng =
      addrObj?.lng ??
      addrObj?.longitude ??
      addrObj?.latlng?.lng ??
      addrObj?.location?.lng;

    try {
      let url = "";
      if (lat != null && lng != null) {
        if (Platform.OS === "ios") {
          url = `http://maps.apple.com/?ll=${lat},${lng}`;
        } else {
          url = `geo:${lat},${lng}?q=${lat},${lng}`;
        }
      } else {
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          formatted
        )}`;
      }

      const supported = await Linking.canOpenURL(url);
      if (!supported && url.startsWith("geo:")) {
        url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
      await Linking.openURL(url);
    } catch (err) {
      // fallback to web search
      const web = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        formatAddress(item?.address)
      )}`;
      Linking.openURL(web).catch(() => console.warn("Failed to open maps"));
    }
  };

  return (
    <View style={styles.card}>
      {/* top row: thumbnail + body */}
      <View style={styles.cardRow}>
        {/* wrap thumbnail so badge can be positioned relative to the image and clipped if needed */}
        <View style={styles.thumbWrap}>
          {uri ? (
            <Image source={uri} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]} />
          )}

          {imageCount > 0 && (
            <View style={styles.imageBadge}>
              <Icon name="image-multiple" size={12} color="#fff" />
              <Text style={styles.imageBadgeText}> {imageCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.rowTop}>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {typeof item.title === "string"
                ? item.title
                : String(item.title ?? "Untitled room")}
            </Text>
            <View style={styles.rowRight}>
              {isVip ? (
                <View style={styles.vipTop}>
                  <Text style={styles.vipTopText}>VIP</Text>
                </View>
              ) : null}
              {formatPrice(item.price) ? (
                <Text style={styles.roomPriceSmall}>
                  {formatPrice(item.price)}
                </Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity onPress={openMap} activeOpacity={0.7}>
            <Text
              style={[styles.roomMeta, styles.addressLink]}
              numberOfLines={1}
            >
              {formatAddress(item.address)}
            </Text>
          </TouchableOpacity>

          <View style={styles.rowMeta}>
            {area ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{area} m²</Text>
              </View>
            ) : null}
            {showConveniences.map((c: string, idx: number) =>
              renderConvenience(c, idx)
            )}
            {moreConveniences > 0 && (
              <View style={[styles.chipSmall, { backgroundColor: "#f1f5f9" }]}>
                <Text style={styles.chipTextSmall}>+{moreConveniences}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Footer with landlord and actions - moved outside cardBody so it spans full card width */}
      <View style={styles.cardFooter}>
        <View style={styles.cardFooterInner}>
          <View style={styles.landlordRow}>
            {landlordAvatarUri ? (
              <Image
                source={landlordAvatarUri}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{landlordInitials}</Text>
              </View>
            )}
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.landlordName} numberOfLines={1}>
                {landlordName}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onToggle(item.id)}
              style={styles.heartBtn}
            >
              <Icon
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? "#ef4444" : "#94a3b8"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleOpenRoomDetail(item.id);
              }}
              style={styles.detailBtn}
            >
              <Text style={styles.detailText} numberOfLines={1}>
                See Detail
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const FavoriteScreen = ({ navigation }: Props) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 6;

  const favoriteIds = useFavoriteStore((s) => s.favoriteRoomIds);

  const load = useCallback(
    async (p = 0) => {
      setError(null);
      try {
        setLoading(true);
        const res: any = await fetchFavoriteRooms(p, pageSize);
        const content = res?.content || [];
        setRooms(content);
        setPage(res?.page ?? p);
        setTotalPages(res?.totalPages ?? 1);
        // sync store ids
        fetchAndUpdateFavorites();
      } catch (err: any) {
        console.error("Failed to load favorites", err);
        setError(err?.message || "Failed to load favorites");
        setRooms([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchAndUpdateFavorites]
  );

  // Auto-fetch when screen comes into focus (when user taps on tab)
  useFocusEffect(
    useCallback(() => {
      load(0);
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(0);
    setRefreshing(false);
  }, [load]);

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      // optimistic toggle
      const isFav = favoriteIds.has(id);
      if (isFav) {
        const ok = await removeFavorite(id);
        if (!ok) {
          // optionally show toast
        } else {
          setRooms((r) => r.filter((it) => it.id !== id));
          // show success toast when removing from favorites
          try {
            Toast.show({
              type: "success",
              text1: "Removed from favorites",
              text2: "Room removed from your favorites.",
              visibilityTime: 2000,
            });
          } catch (e) {
            // ignore if toast fails
          }
        }
      } else {
        const ok = await addFavorite(id);
        if (ok) {
          // reload page to reflect change
          load(page);
        }
      }
    },
    [favoriteIds, load, page]
  );

  if (loading && rooms.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f8ef7" />
        <Text style={styles.hint}>Loading favorite rooms...</Text>
        {error ? (
          <Text style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</Text>
        ) : null}
      </View>
    );
  }

  if (error && rooms.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#ff6b6b", fontSize: 16, marginBottom: 8 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => load(0)}
          style={[styles.pageBtn, { paddingHorizontal: 20 }]}
        >
          <Text style={styles.pageText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Favorites</Text>
              <Text style={styles.headerSubtitle}>
                {rooms.length} {rooms.length === 1 ? "room" : "rooms"} saved
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Icon name="heart" size={24} color="#EF4444" />
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#EF4444"
            colors={["#EF4444"]}
          />
        }
        renderItem={({ item }) => (
          <RoomCard
            item={item}
            isFavorite={favoriteIds.has(item.id)}
            onToggle={handleToggleFavorite}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Icon name="heart-outline" size={64} color="#E5E7EB" />
            </View>
            <Text style={styles.emptyTitle}>No favorite rooms yet</Text>
            <Text style={styles.emptySub}>
              Explore amazing rooms and tap the heart icon to save them here
            </Text>
          </View>
        )}
      />

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => {
              if (page > 0) load(page - 1);
            }}
            disabled={page === 0}
            style={[styles.pageBtn, page === 0 && styles.disabledBtn]}
          >
            <Icon
              name="chevron-left"
              size={20}
              color={page === 0 ? "#CBD5E1" : "#1A1A2E"}
            />
            <Text style={[styles.pageText, page === 0 && styles.disabledText]}>
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.pageInfoContainer}>
            <Text style={styles.pageInfo}>
              {page + 1} / {totalPages || 1}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              if (page + 1 < (totalPages || 1)) load(page + 1);
            }}
            disabled={page + 1 >= (totalPages || 1)}
            style={[
              styles.pageBtn,
              page + 1 >= (totalPages || 1) && styles.disabledBtn,
            ]}
          >
            <Text
              style={[
                styles.pageText,
                page + 1 >= (totalPages || 1) && styles.disabledText,
              ]}
            >
              Next
            </Text>
            <Icon
              name="chevron-right"
              size={20}
              color={page + 1 >= (totalPages || 1) ? "#CBD5E1" : "#1A1A2E"}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default FavoriteScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  // Modern Header
  headerGradient: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#EF4444",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hint: { marginTop: 8, color: "#64748b" },
  card: {
    flexDirection: "column",
    alignItems: "stretch",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    minWidth: 0,
  },
  thumbWrap: {
    position: "relative",
    width: 120,
    height: 90,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    marginRight: 14,
    alignSelf: "flex-start",
  },
  thumb: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    backgroundColor: "#F3F4F6",
  },
  thumbPlaceholder: {
    backgroundColor: "#E5E7EB",
    borderRadius: 16,
  },
  imageBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 0,
  },
  imageBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  cardBody: {
    flex: 1,
    paddingLeft: 0,
    minWidth: 0,
    justifyContent: "space-between",
    minHeight: 90,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomTitle: {
    color: "#1A1A2E",
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
    letterSpacing: 0.2,
  },
  addressLink: { color: "#3B82F6" },
  roomTitleMultiline: {},
  roomPriceSmall: {
    color: "#EF4444",
    fontWeight: "800",
    fontSize: 16,
  },
  rowRight: { flexDirection: "row", alignItems: "center" },
  vipTop: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  vipTopText: { color: "#92400E", fontSize: 12, fontWeight: "700" },
  roomMeta: { color: "#6B7280", fontSize: 13, marginTop: 6, fontWeight: "500" },
  rowMeta: {
    flexDirection: "row",
    marginTop: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  chip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 6,
    marginTop: 6,
  },
  chipText: { color: "#475569", fontSize: 12, fontWeight: "600" },
  vip: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  vipText: { color: "#92400E", fontSize: 12, fontWeight: "700" },
  roomPrice: { color: "#EF4444", fontWeight: "700", marginTop: 6 },
  favBtn: {
    padding: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 14,
    paddingHorizontal: 0,
  },
  cardFooterInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  landlordRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#DBEAFE",
  },
  avatarPlaceholder: {
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: "#1A1A2E",
    fontWeight: "700",
    fontSize: 14,
  },
  landlordName: { color: "#1A1A2E", fontWeight: "700", fontSize: 15 },
  contactInfo: { color: "#6B7280", fontSize: 12 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    marginLeft: 8,
    alignSelf: "flex-end",
  },
  heartBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    marginRight: 8,
  },
  detailBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3B82F6",
    backgroundColor: "#3B82F6",
    maxWidth: 120,
    overflow: "hidden",
  },
  detailText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  empty: {
    padding: 48,
    alignItems: "center",
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: "#1A1A2E",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySub: {
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  pagination: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  pageBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledBtn: { opacity: 0.5 },
  pageText: {
    color: "#1A1A2E",
    fontWeight: "700",
    fontSize: 14,
  },
  disabledText: { color: "#CBD5E1" },
  pageInfoContainer: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pageInfo: {
    color: "#1A1A2E",
    fontWeight: "700",
    fontSize: 14,
  },
  chipSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
    marginRight: 6,
    marginTop: 6,
  },
  chipTextSmall: { color: "#475569", fontSize: 12, fontWeight: "600" },
});
