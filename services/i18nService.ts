import { useState, useEffect, useCallback } from 'react';

export type Locale = 'zh' | 'en';

const LOCALE_KEY = 'forsion_desktop_locale';
const LOCALE_EVENT = 'locale-changed';

const translations: Record<string, Record<Locale, string>> = {
  // User profile card
  'user.center': { zh: '用户中心', en: 'User Center' },
  'user.manage': { zh: '管理账户', en: 'Manage Account' },
  'user.logout': { zh: '退出', en: 'Logout' },
  'user.login': { zh: '登录', en: 'Login' },
  'user.settings': { zh: '账户设置', en: 'Account Settings' },
  'user.profile': { zh: '个人设置', en: 'Profile' },
  'user.loggedIn': { zh: '已登录', en: 'Logged In' },

  // User settings modal
  'settings.nickname': { zh: '昵称', en: 'Nickname' },
  'settings.nickname.placeholder': { zh: '输入昵称', en: 'Enter nickname' },
  'settings.nickname.notSet': { zh: '未设置', en: 'Not set' },
  'settings.username': { zh: '用户名', en: 'Username' },
  'settings.email': { zh: '邮箱', en: 'Email' },
  'settings.phone': { zh: '手机', en: 'Phone' },
  'settings.role': { zh: '角色', en: 'Role' },
  'settings.registered': { zh: '注册时间', en: 'Registered' },
  'settings.credits': { zh: '积分账户', en: 'Credits' },
  'settings.balance': { zh: '当前余额', en: 'Balance' },
  'settings.totalEarned': { zh: '累计获得', en: 'Total Earned' },
  'settings.totalSpent': { zh: '累计消费', en: 'Total Spent' },
  'settings.recharge': { zh: '充值积分', en: 'Recharge' },
  'settings.loadingCredits': { zh: '加载积分信息...', en: 'Loading credits...' },
  'settings.creditsUnavailable': { zh: '积分信息暂时无法加载', en: 'Credits unavailable' },
  'settings.lastUpdated': { zh: '最后更新', en: 'Last updated' },
  'settings.notSet': { zh: '未设置', en: 'Not set' },

  // General
  'loading': { zh: '加载中...', en: 'Loading...' },
  'loginRequired': { zh: '请先登录', en: 'Please login first' },

  // AI Chat
  'chat.compose': { zh: 'AI 聊天... (⌘K)', en: 'AI Chat... (⌘K)' },
  'chat.placeholder': { zh: '你在想什么？', en: "What's on your mind?" },
  'chat.newConversation': { zh: '新对话', en: 'New Conversation' },
  'chat.noConversations': { zh: '还没有对话', en: 'No conversations yet' },
  'chat.noModels': { zh: '无可用模型', en: 'No Models Available' },
  'chat.selectModel': { zh: '选择模型', en: 'Select Model' },

  // Search
  'search.placeholder': { zh: '搜索...', en: 'Search...' },
  'search.enginePrefs': { zh: '搜索引擎偏好', en: 'Search Engine Preferences' },
  'search.aiAssistant': { zh: 'AI 助手', en: 'AI Assistant' },
  'search.history': { zh: '搜索历史', en: 'Recent Searches' },
  'search.clearHistory': { zh: '清除', en: 'Clear' },
  'search.noHistory': { zh: '暂无搜索记录', en: 'No search history' },
  'search.defaultEngine': { zh: '默认搜索引擎', en: 'Default Search Engine' },
  'search.defaultEngineDesc': { zh: '设置搜索栏的默认引擎', en: 'Set the default engine for the search bar' },

  // Settings — categories
  'settings.category.appearance': { zh: '外观', en: 'Appearance' },
  'settings.category.performance': { zh: '性能', en: 'Performance' },
  'settings.category.about': { zh: '关于', en: 'About' },

  // Settings — Appearance
  'appearance.title': { zh: '外观', en: 'Appearance' },
  'appearance.subtitle': { zh: '主题、壁纸和颜色设置。', en: 'Theme, wallpaper, and color settings.' },
  'appearance.themePresets': { zh: '主题预设', en: 'Theme Presets' },
  'appearance.wallpaper': { zh: '壁纸', en: 'Wallpaper' },
  'appearance.upload': { zh: '上传', en: 'Upload' },
  'appearance.reset': { zh: '重置', en: 'Reset' },
  'appearance.extracting': { zh: '正在提取颜色...', en: 'Extracting colors...' },
  'appearance.autoAdapt': { zh: '自动适配颜色', en: 'Auto-adapt Colors' },
  'appearance.autoAdaptDesc': { zh: '从壁纸自动提取 UI 配色', en: 'Automatically extract UI colors from wallpaper' },
  'appearance.overlayEffects': { zh: '遮罩效果', en: 'Overlay Effects' },
  'appearance.vignetting': { zh: '暗角', en: 'Vignetting' },
  'appearance.vignettingDesc': { zh: '对壁纸边缘应用径向渐变暗化', en: 'Apply radial gradient darkening to wallpaper edges' },
  'appearance.focusBlur': { zh: '聚焦模糊', en: 'Focus Blur' },
  'appearance.focusBlurDesc': { zh: '打开窗口时模糊并调暗壁纸', en: 'Blur and dim wallpaper when windows are open' },

  // Settings — Performance
  'performance.title': { zh: '性能', en: 'Performance' },
  'performance.subtitle': { zh: '渲染和动画设置。', en: 'Rendering and animation settings.' },
  'performance.gpuAcceleration': { zh: 'GPU 加速', en: 'GPU Acceleration' },
  'performance.gpuDesc': { zh: '使用硬件加速获得更流畅的动画', en: 'Use hardware acceleration for smoother animations' },

  // Settings — About
  'about.documentation': { zh: '文档与帮助', en: 'Documentation' },
  'about.termsOfService': { zh: '服务条款', en: 'Terms of Service' },
  'about.privacyPolicy': { zh: '隐私政策', en: 'Privacy Policy' },
  'about.deskGuide': { zh: 'Forsion Desk 使用指南', en: 'Forsion Desk Guide' },
  'about.title': { zh: '关于', en: 'About' },
  'about.subtitle': { zh: '系统信息和诊断。', en: 'System information and diagnostics.' },
  'about.version': { zh: '版本 2.0', en: 'Version 2.0' },
  'about.techStack': { zh: 'React 19 + Vite + TypeScript', en: 'React 19 + Vite + TypeScript' },
  'about.backendConnection': { zh: '后端连接', en: 'Backend Connection' },
  'about.testConnection': { zh: '测试连接', en: 'Test Connection' },
  'about.testing': { zh: '测试中...', en: 'Testing...' },
  'about.backendRunning': { zh: '后端服务正常运行。数据库：', en: 'Backend server is running. Database: ' },
  'about.connected': { zh: '已连接', en: 'Connected' },
  'about.disconnected': { zh: '已断开', en: 'Disconnected' },
  'about.error': { zh: '错误', en: 'Error' },
  'about.connectFailed': { zh: '无法连接到后端服务', en: 'Failed to connect to backend server' },

  // Bing Gallery
  'bing.loading': { zh: '正在加载必应壁纸...', en: 'Loading Bing wallpapers...' },
  'bing.retry': { zh: '重试', en: 'Retry' },
  'bing.daily': { zh: '必应每日', en: 'Bing Daily' },
  'bing.todaysPick': { zh: '今日精选', en: "Today's Pick" },

  // Widget Board
  'widget.horizon': { zh: '时光', en: 'Horizon' },
  'widget.calmTide': { zh: '平静的潮水即将来临', en: 'A calm tide ahead' },
  'widget.deepWork': { zh: '9:00 AM - 深度工作', en: '9:00 AM - Deep Work' },
  'widget.creativeDrift': { zh: '1:30 PM - 创意漫游', en: '1:30 PM - Creative Drift' },
  'widget.quickTips': { zh: '快捷提示', en: 'Quick Tips' },
  'widget.tip.click': { zh: '点击图标：', en: 'Click icon: ' },
  'widget.tip.clickDesc': { zh: '打开应用', en: 'Open app' },
  'widget.tip.drag': { zh: '长按拖动：', en: 'Hold & drag: ' },
  'widget.tip.dragDesc': { zh: '重新排列 Dock', en: 'Rearrange Dock' },
  'widget.tip.launchpad': { zh: '启动台：', en: 'Launchpad: ' },
  'widget.tip.launchpadDesc': { zh: '点击图标右上角 ⋮ 查看选项', en: 'Click ⋮ on icon for options' },

  // Uninstall Dialog
  'dialog.uninstall.title': { zh: '卸载 {name}？', en: 'Uninstall {name}?' },
  'dialog.uninstall.message': { zh: '此应用将从启动台中移除。您可以稍后从应用市场重新安装。', en: 'This app will be removed from your Launchpad. You can reinstall it later from the App Market.' },
  'dialog.cancel': { zh: '取消', en: 'Cancel' },
  'dialog.uninstall.confirm': { zh: '卸载', en: 'Uninstall' },
};

export function getLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_KEY);
  if (saved === 'en' || saved === 'zh') return saved;
  return 'zh';
}

export function setLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_KEY, locale);
  window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: { locale } }));
}

export function t(key: string, locale?: Locale): string {
  const l = locale || getLocale();
  return translations[key]?.[l] || key;
}

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getLocale);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setLocaleState(detail.locale);
    };
    window.addEventListener(LOCALE_EVENT, handler);
    return () => window.removeEventListener(LOCALE_EVENT, handler);
  }, []);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocale(newLocale);
  }, []);

  const translate = useCallback((key: string) => {
    return translations[key]?.[locale] || key;
  }, [locale]);

  return { locale, setLocale: changeLocale, t: translate };
}
