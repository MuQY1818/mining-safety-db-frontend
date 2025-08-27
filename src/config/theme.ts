// 矿大蓝主题配置
import { theme } from 'antd';

// 矿大蓝配色方案
export const MINING_BLUE_COLORS = {
  // 主色调 - 矿大蓝
  primary: '#1e3a8a',      // 深蓝色 - 主要按钮、标题
  secondary: '#3b82f6',    // 中蓝色 - 链接、次要按钮
  light: '#dbeafe',        // 浅蓝色 - 背景、卡片
  accent: '#1d4ed8',       // 强调蓝 - 重要提示

  // 安全等级配色
  safety: {
    critical: '#dc2626',   // 红色 - 极高风险
    high: '#f59e0b',       // 橙色 - 高风险
    medium: '#eab308',     // 黄色 - 中等风险
    low: '#16a34a',        // 绿色 - 低风险
  },

  // 辅助色彩
  text: {
    primary: '#1f2937',    // 主要文字
    secondary: '#6b7280',  // 次要文字
    light: '#9ca3af',      // 浅色文字
    tertiary: '#d1d5db',   // 三级文字
    white: '#ffffff',      // 白色文字
  },

  background: {
    primary: '#f8fafc',    // 页面背景
    page: '#f8fafc',       // 页面背景（别名）
    card: '#ffffff',       // 卡片背景
    hover: '#f1f5f9',      // 悬停背景
    active: '#e2e8f0',     // 激活背景
    selected: '#eff6ff',   // 选中背景
  },

  border: {
    light: '#e5e7eb',      // 浅色边框
    medium: '#d1d5db',     // 中等边框
    dark: '#9ca3af',       // 深色边框
  }
};

// Ant Design主题配置
export const antdTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // 主色
    colorPrimary: MINING_BLUE_COLORS.primary,
    colorSuccess: MINING_BLUE_COLORS.safety.low,
    colorWarning: MINING_BLUE_COLORS.safety.medium,
    colorError: MINING_BLUE_COLORS.safety.critical,
    colorInfo: MINING_BLUE_COLORS.secondary,

    // 背景色
    colorBgContainer: MINING_BLUE_COLORS.background.card,
    colorBgElevated: MINING_BLUE_COLORS.background.card,
    colorBgLayout: MINING_BLUE_COLORS.background.primary,

    // 文字颜色
    colorText: MINING_BLUE_COLORS.text.primary,
    colorTextSecondary: MINING_BLUE_COLORS.text.secondary,
    colorTextTertiary: MINING_BLUE_COLORS.text.light,

    // 边框
    colorBorder: MINING_BLUE_COLORS.border.light,
    colorBorderSecondary: MINING_BLUE_COLORS.border.medium,

    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,

    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,

    // 阴影
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  components: {
    // 按钮组件
    Button: {
      colorPrimary: MINING_BLUE_COLORS.primary,
      algorithm: true,
    },
    
    // 菜单组件
    Menu: {
      itemSelectedBg: MINING_BLUE_COLORS.light,
      itemSelectedColor: MINING_BLUE_COLORS.primary,
      itemHoverBg: MINING_BLUE_COLORS.background.hover,
    },

    // 表格组件
    Table: {
      headerBg: MINING_BLUE_COLORS.background.primary,
      headerColor: MINING_BLUE_COLORS.text.primary,
      rowHoverBg: MINING_BLUE_COLORS.background.hover,
    },

    // 卡片组件
    Card: {
      headerBg: MINING_BLUE_COLORS.background.card,
      colorBorderSecondary: MINING_BLUE_COLORS.border.light,
    },

    // 标签组件
    Tag: {
      defaultBg: MINING_BLUE_COLORS.background.hover,
      defaultColor: MINING_BLUE_COLORS.text.primary,
    },

    // 输入框组件
    Input: {
      hoverBorderColor: MINING_BLUE_COLORS.secondary,
      activeBorderColor: MINING_BLUE_COLORS.primary,
    },

    // 选择器组件
    Select: {
      optionSelectedBg: MINING_BLUE_COLORS.light,
      optionActiveBg: MINING_BLUE_COLORS.background.hover,
    }
  }
};

// 安全等级颜色映射
export const getSafetyLevelColor = (level: string): string => {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
      return MINING_BLUE_COLORS.safety.critical;
    case 'HIGH':
      return MINING_BLUE_COLORS.safety.high;
    case 'MEDIUM':
      return MINING_BLUE_COLORS.safety.medium;
    case 'LOW':
      return MINING_BLUE_COLORS.safety.low;
    default:
      return MINING_BLUE_COLORS.text.secondary;
  }
};

// 安全等级图标映射
export const getSafetyLevelIcon = (level: string): string => {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
      return '🔴';
    case 'HIGH':
      return '🟠';
    case 'MEDIUM':
      return '🟡';
    case 'LOW':
      return '🟢';
    default:
      return '⚪';
  }
};

// CSS变量定义
export const cssVariables = `
:root {
  /* 矿大蓝主色调 */
  --color-primary: ${MINING_BLUE_COLORS.primary};
  --color-secondary: ${MINING_BLUE_COLORS.secondary};
  --color-light: ${MINING_BLUE_COLORS.light};
  --color-accent: ${MINING_BLUE_COLORS.accent};

  /* 安全等级颜色 */
  --color-safety-critical: ${MINING_BLUE_COLORS.safety.critical};
  --color-safety-high: ${MINING_BLUE_COLORS.safety.high};
  --color-safety-medium: ${MINING_BLUE_COLORS.safety.medium};
  --color-safety-low: ${MINING_BLUE_COLORS.safety.low};

  /* 文字颜色 */
  --color-text-primary: ${MINING_BLUE_COLORS.text.primary};
  --color-text-secondary: ${MINING_BLUE_COLORS.text.secondary};
  --color-text-light: ${MINING_BLUE_COLORS.text.light};

  /* 背景颜色 */
  --color-bg-primary: ${MINING_BLUE_COLORS.background.primary};
  --color-bg-card: ${MINING_BLUE_COLORS.background.card};
  --color-bg-hover: ${MINING_BLUE_COLORS.background.hover};

  /* 边框颜色 */
  --color-border-light: ${MINING_BLUE_COLORS.border.light};
  --color-border-medium: ${MINING_BLUE_COLORS.border.medium};
}
`;
