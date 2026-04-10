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

  // App names
  'app.name.forsion-desk-market': { zh: '市场', en: 'Market' },
  'app.name.launchpad': { zh: '抽屉', en: 'Drawer' },
  'app.name.settings': { zh: '设置', en: 'Settings' },

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
  'search.aiAssistant': { zh: '汤谷智能体', en: 'Tangu Agent' },
  'search.history': { zh: '搜索历史', en: 'Recent Searches' },
  'search.clearHistory': { zh: '清除', en: 'Clear' },
  'search.noHistory': { zh: '暂无搜索记录', en: 'No search history' },
  'search.defaultEngine': { zh: '默认搜索引擎', en: 'Default Search Engine' },
  'search.defaultEngineDesc': { zh: '设置搜索栏的默认引擎', en: 'Set the default engine for the search bar' },

  // Settings — categories
  'settings.category.appearance': { zh: '外观', en: 'Appearance' },
  'settings.category.shortcuts': { zh: '快捷操作', en: 'Shortcuts' },
  'settings.category.performance': { zh: '性能', en: 'Performance' },
  'settings.category.about': { zh: '关于', en: 'About' },

  // Settings — Shortcuts
  'shortcuts.title': { zh: '快捷操作', en: 'Shortcuts' },
  'shortcuts.subtitle': { zh: '为桌面交互绑定快捷操作。', en: 'Bind quick actions to desktop interactions.' },
  'shortcuts.rightClickEmpty': { zh: '右键空白区域', en: 'Right-click Empty Area' },
  'shortcuts.rightClickEmptyDesc': { zh: '在桌面空白处右键时执行的操作', en: 'Action when right-clicking empty desktop area' },
  'shortcuts.clickTitle': { zh: '单击标题区', en: 'Click Title Area' },
  'shortcuts.clickTitleDesc': { zh: '单击 "Forsion is All You Need" 标题时执行的操作', en: 'Action when clicking the "Forsion is All You Need" title' },
  'shortcuts.actionNone': { zh: '无', en: 'None' },
  'shortcuts.actionLaunchpad': { zh: '打开启动台', en: 'Open Launchpad' },
  'shortcuts.actionSearch': { zh: '聚焦搜索', en: 'Focus Search' },

  // Settings — Appearance
  'appearance.title': { zh: '外观', en: 'Appearance' },
  'appearance.subtitle': { zh: '主题、壁纸和颜色设置。', en: 'Theme, wallpaper, and color settings.' },
  'appearance.themePresets': { zh: '主题预设', en: 'Theme Presets' },
  'appearance.wallpaper': { zh: '壁纸', en: 'Wallpaper' },
  'appearance.upload': { zh: '上传', en: 'Upload' },
  'appearance.reset': { zh: '重置', en: 'Reset' },
  'appearance.extracting': { zh: '正在提取颜色...', en: 'Extracting colors...' },
  'appearance.bingDaily': { zh: '每日自动更换壁纸', en: 'Daily Bing Wallpaper' },
  'appearance.bingDailyDesc': { zh: '启动时自动应用必应每日推荐壁纸', en: 'Auto-apply Bing daily wallpaper on launch' },
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

  // Widget Cards
  'widget.horizon': { zh: '时光', en: 'Horizon' },
  'widget.quickTips': { zh: '快捷提示', en: 'Quick Tips' },
  'widget.tip.click': { zh: '点击图标：', en: 'Click icon: ' },
  'widget.tip.clickDesc': { zh: '打开应用', en: 'Open app' },
  'widget.tip.drag': { zh: '长按拖动：', en: 'Hold & drag: ' },
  'widget.tip.dragDesc': { zh: '重新排列 Dock', en: 'Rearrange Dock' },
  'widget.tip.launchpad': { zh: '启动台：', en: 'Launchpad: ' },
  'widget.tip.launchpadDesc': { zh: '点击图标右上角 ⋮ 查看选项', en: 'Click ⋮ on icon for options' },
  // Card type labels
  'widget.card.date': { zh: '日期', en: 'Date' },
  'widget.card.announcement': { zh: '公告', en: 'Announcements' },
  'widget.card.weather': { zh: '天气', en: 'Weather' },
  'widget.card.slogan': { zh: '标语', en: 'Slogan' },
  'widget.card.time': { zh: '时间', en: 'Time' },
  'widget.card.greeting': { zh: '问候', en: 'Greeting' },
  'widget.card.quicknotes': { zh: '便签', en: 'Quick Notes' },
  'widget.card.countdown': { zh: '倒计时', en: 'Countdown' },
  // Card settings
  'widget.setting.calendarType': { zh: '日历类型', en: 'Calendar Type' },
  'widget.setting.location': { zh: '位置', en: 'Location' },
  'widget.setting.text': { zh: '文本', en: 'Text' },
  'widget.setting.font': { zh: '字体', en: 'Font' },
  'widget.setting.opacity': { zh: '透明度', en: 'Opacity' },
  'widget.setting.showSeconds': { zh: '显示秒', en: 'Show Seconds' },
  'widget.setting.is24h': { zh: '24小时制', en: '24-hour Format' },
  'widget.setting.showName': { zh: '显示名称', en: 'Show Name' },
  'widget.setting.targetDate': { zh: '目标日期', en: 'Target Date' },
  'widget.setting.eventLabel': { zh: '事件名称', en: 'Event Name' },
  // Weather card
  'widget.weather.loading': { zh: '加载中...', en: 'Loading...' },
  'widget.weather.unavailable': { zh: '天气数据不可用', en: 'Weather unavailable' },
  'widget.weather.humidity': { zh: '湿度', en: 'Humidity' },
  'widget.weather.wind': { zh: '风速', en: 'Wind' },
  'widget.weather.currentLocation': { zh: '当前位置', en: 'Current Location' },
  // Card editor UI
  'widget.editTitle': { zh: '编辑小组件', en: 'Editing Widgets' },
  'widget.addWidget': { zh: '添加小组件', en: 'Add Widget' },
  'widget.save': { zh: '保存', en: 'Save' },
  'widget.cancel': { zh: '取消', en: 'Cancel' },
  'widget.settings': { zh: '设置', en: 'Settings' },
  'widget.add': { zh: '添加', en: 'Add' },
  'widget.noWidgets': { zh: '暂无可用小组件', en: 'No widgets available for this zone.' },
  // App name
  'app.name.widgets': { zh: '小组件', en: 'Widgets' },

  // Launchpad context menu
  'launchpad.addToDock': { zh: '添加到 Dock 栏', en: 'Add to Dock' },
  'launchpad.removeFromDock': { zh: '从 Dock 栏移除', en: 'Remove from Dock' },
  'launchpad.uninstall': { zh: '卸载', en: 'Uninstall' },
  'launchpad.addBookmark': { zh: '添加书签', en: 'Add Bookmark' },
  'launchpad.addFolder': { zh: '新建收纳夹', en: 'New Folder' },
  'launchpad.edit': { zh: '编辑', en: 'Edit' },
  'launchpad.delete': { zh: '删除', en: 'Delete' },
  'launchpad.rename': { zh: '重命名', en: 'Rename' },
  'launchpad.bookmark.url': { zh: '网址', en: 'URL' },
  'launchpad.bookmark.title': { zh: '标题', en: 'Title' },
  'launchpad.bookmark.titlePlaceholder': { zh: '留空自动获取', en: 'Leave empty to auto-detect' },
  'launchpad.bookmark.icon': { zh: '图标', en: 'Icon' },
  'launchpad.folder.name': { zh: '收纳夹名称', en: 'Folder Name' },
  'launchpad.folder.defaultName': { zh: '新收纳夹', en: 'New Folder' },

  // Market
  'market.title': { zh: '市场', en: 'Market' },
  'market.searchPlaceholder': { zh: '搜索应用...', en: 'Search apps...' },
  'market.loading': { zh: '正在加载应用...', en: 'Loading apps...' },
  'market.retry': { zh: '重试', en: 'Retry' },
  'market.noResults': { zh: '没有找到匹配的应用。', en: 'No apps found.' },
  'market.noApps': { zh: '暂无可用应用。', en: 'No apps available.' },
  'market.installed': { zh: '已安装', en: 'Installed' },
  'market.get': { zh: '获取', en: 'Get' },

  // Settings — Launchpad/Drawer
  'settings.category.launchpad': { zh: '抽屉', en: 'Drawer' },
  'launchpad.settings.title': { zh: '抽屉设置', en: 'Drawer Settings' },
  'launchpad.settings.subtitle': { zh: '图标布局和排列方式。', en: 'Icon layout and arrangement.' },
  'launchpad.settings.columns': { zh: '每行图标数', en: 'Icons per Row' },
  'launchpad.settings.columnsDesc': { zh: '调整每行显示的图标数量', en: 'Adjust icons displayed per row' },

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
