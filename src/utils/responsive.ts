import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Thiết lập kích thước chuẩn (iPhone X)
const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

// Tính toán tỷ lệ
const widthScale = SCREEN_WIDTH / DESIGN_WIDTH;
const heightScale = SCREEN_HEIGHT / DESIGN_HEIGHT;

// Chọn tỷ lệ nhỏ hơn để đảm bảo nội dung không bị cắt
const scale = Math.min(widthScale, heightScale);

/**
 * Chuyển đổi kích thước thiết kế thành kích thước responsive
 */
export const normalize = (size: number): number => {
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  }
  
  // Android cần xử lý đặc biệt để tránh pixel lẻ
  return Math.round(newSize) - 2;
};

/**
 * Responsive width dựa trên phần trăm màn hình
 */
export const wp = (percentage: number): number => {
  return (percentage * SCREEN_WIDTH) / 100;
};

/**
 * Responsive height dựa trên phần trăm màn hình
 */
export const hp = (percentage: number): number => {
  return (percentage * SCREEN_HEIGHT) / 100;
};

/**
 * Kích thước font responsive
 */
export const fontSize = {
  xs: normalize(10),    // 10px
  sm: normalize(12),    // 12px  
  base: normalize(14),  // 14px
  md: normalize(16),    // 16px
  lg: normalize(18),    // 18px
  xl: normalize(20),    // 20px
  '2xl': normalize(24), // 24px
  '3xl': normalize(28), // 28px
  '4xl': normalize(32), // 32px
};

/**
 * Spacing responsive
 */
export const spacing = {
  xs: normalize(2),     // 2px
  sm: normalize(4),     // 4px
  md: normalize(8),     // 8px
  lg: normalize(12),    // 12px
  xl: normalize(16),    // 16px
  '2xl': normalize(20), // 20px
  '3xl': normalize(24), // 24px
  '4xl': normalize(32), // 32px
};

/**
 * Kiểm tra thiết bị nhỏ (width < 350)
 */
export const isSmallDevice = SCREEN_WIDTH < 350;

/**
 * Kiểm tra tablet
 */
export const isTablet = SCREEN_WIDTH >= 768;

/**
 * Margins và paddings responsive
 */
export const layout = {
  screenPadding: isSmallDevice ? spacing.md : spacing.xl,
  cardPadding: isSmallDevice ? spacing.md : spacing.lg,
  sectionSpacing: isSmallDevice ? spacing.lg : spacing.xl,
};

export default {
  normalize,
  wp,
  hp,
  fontSize,
  spacing,
  layout,
  isSmallDevice,
  isTablet,
};