# Forsion Desktop 莫奈配色与对话框动画效果实现指南

本文档详细总结了 Forsion Desktop 项目中莫奈配色方案和对话框动画效果的实现方法，供其他 Forsion 项目参考以复现相同的 UI 风格和动画效果。

---

## 目录

1. [莫奈配色系统](#莫奈配色系统)
2. [对话框动画效果](#对话框动画效果)
3. [完整实现示例](#完整实现示例)
4. [关键技术点总结](#关键技术点总结)

---

## 莫奈配色系统

### 1. 主题定义

在 `constants.tsx` 中定义主题配置：

```typescript
export const THEMES: Theme[] = [
  {
    id: 'monet-cliffs',
    name: 'Monet Cliffs',
    background: 'linear-gradient(to bottom, #98B0B9, #C1A3B5, #3E406F)',
    primary: '#3E406F',        // 深蓝紫色（主色调）
    secondary: '#C1A3B5',      // 淡紫粉色（次要色）
    surface: 'rgba(255, 255, 255, 0.35)',  // 玻璃表面透明度
    text: '#2D2E4A',           // 深色文本
    isDark: false
  },
  // ... 其他主题
];
```

### 2. CSS 变量系统

在 `index.html` 的 `<style>` 标签中定义全局 CSS 变量：

```css
:root {
  --color-primary: #3E406F;
  --color-secondary: #C1A3B5;
  --color-text: #2D2E4A;
  --glass-surface: rgba(255, 255, 255, 0.35);
  --bg-desktop: linear-gradient(to bottom, #98B0B9, #C1A3B5, #3E406F);
}
```

### 3. 玻璃态（Glassmorphism）样式类

定义两种玻璃态效果类：

```css
/* 标准玻璃态 */
.glass {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 增强玻璃态（更不透明，模糊更强） */
.glass-dark {
  background: var(--glass-surface);
  backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### 4. Tailwind CSS 配置集成

在 `index.html` 中配置 Tailwind，使其使用 CSS 变量：

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        accent: 'var(--color-primary)',      // 使用主色调
        'surface-text': 'var(--color-text)', // 使用文本色
      },
      fontFamily: {
        cursive: ['"Dancing Script"', 'cursive'], // 艺术字体
      }
    }
  }
}
```

### 5. 主题动态应用

在 `App.tsx` 中，通过 `useEffect` 将主题值动态应用到 CSS 变量：

```typescript
// Apply theme variables to root
useEffect(() => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', currentTheme.primary);
  root.style.setProperty('--color-secondary', currentTheme.secondary);
  root.style.setProperty('--color-text', currentTheme.text);
  root.style.setProperty('--glass-surface', currentTheme.surface);
  root.style.setProperty('--bg-desktop', 
    currentTheme.wallpaper 
      ? `url(${currentTheme.wallpaper})` 
      : currentTheme.background
  );
}, [currentTheme]);
```

### 6. 桌面背景应用

在组件中使用桌面背景：

```tsx
<div className="absolute inset-0 z-0 bg-desktop-surface">
  <div className="brush-stroke" />  {/* 可选：添加纹理效果 */}
  {/* 背景光晕效果 */}
  <div className="absolute top-[5%] right-[10%] w-[60%] h-[40%] bg-white opacity-[0.1] blur-[140px] rounded-full" />
  <div className="absolute top-[40%] left-[5%] w-[50%] h-[40%] bg-white opacity-[0.05] blur-[110px] rounded-full" />
</div>
```

**CSS 辅助类**：

```css
.bg-desktop-surface {
  background: var(--bg-desktop);
  background-size: cover;
  background-position: center;
}
```

---

## 对话框动画效果

### 1. 依赖库

使用 **framer-motion** 实现动画效果：

```json
{
  "dependencies": {
    "framer-motion": "^12.23.26"
  }
}
```

### 2. 标准模态框动画模式

#### 2.1 基本模态框动画（UserSettingsModal / LoginModal）

使用 `AnimatePresence` 包裹，`motion.div` 实现动画：

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass-dark rounded-[32px] shadow-2xl border border-white/40"
      >
        {/* 内容 */}
      </motion.div>
    </div>
  )}
</AnimatePresence>
```

**关键参数**：
- `initial`: 初始状态（透明度 0，缩放 0.95）
- `animate`: 动画目标（透明度 1，缩放 1）
- `exit`: 退出状态（与初始相同）
- `transition`: 使用 spring 动画，`stiffness: 300`（弹性强度），`damping: 30`（阻尼）

#### 2.2 窗口打开动画（WindowManager）

窗口打开时的动画：

```tsx
<AnimatePresence>
  {windows.filter(w => !w.isMinimized).map((win) => (
    <motion.div
      key={win.id}
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass-dark rounded-2xl"
    >
      {/* 窗口内容 */}
    </motion.div>
  ))}
</AnimatePresence>
```

**动画特点**：
- 从下方（y: 20）滑入，同时缩放和透明度变化
- 使用相同的 spring 参数保证动画一致性

#### 2.3 复杂布局动画（AIChat）

AI 聊天框的复杂动画，使用 `layout` 属性实现响应式布局变化：

```tsx
<motion.div
  layout
  initial={false}
  animate={{ 
    height: isOpen ? 560 : 84,
    y: isOpen ? 0 : 180,
    x: hasAppOpen && isOpen ? 'calc(50vw - 20px - 50%)' : 0,
    width: hasAppOpen && isOpen ? 'calc(50vw - 80px)' : 680,
    maxWidth: hasAppOpen && isOpen ? 500 : 680,
    scale: hasAppOpen && !isOpen ? 0.9 : 1
  }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  className="rounded-[32px] glass-dark"
>
  {/* 内容 */}
</motion.div>
```

**关键特性**：
- `layout` 属性：自动处理布局变化动画
- 多属性同时变化：height, y, x, width, scale
- 根据应用状态（`hasAppOpen`）动态调整位置和大小

#### 2.4 内部内容淡入动画

模态框内部内容的淡入效果：

```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1"
    >
      {/* 内容 */}
    </motion.div>
  )}
</AnimatePresence>
```

#### 2.5 元素渐入动画（App.tsx 标题）

延迟渐入效果：

```tsx
<motion.h1 
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-7xl font-cursive text-surface-text opacity-40"
>
  Forsion is All You Need
</motion.h1>
```

---

## 完整实现示例

### 示例 1：标准模态框组件

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass-dark rounded-[32px] shadow-2xl border border-white/40 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
```

### 示例 2：主题配置与应用

```typescript
// types.ts
export interface Theme {
  id: string;
  name: string;
  background: string;
  primary: string;
  secondary: string;
  surface: string;
  text: string;
  isDark: boolean;
  wallpaper?: string;
}

// constants.tsx
export const THEMES: Theme[] = [
  {
    id: 'monet-cliffs',
    name: 'Monet Cliffs',
    background: 'linear-gradient(to bottom, #98B0B9, #C1A3B5, #3E406F)',
    primary: '#3E406F',
    secondary: '#C1A3B5',
    surface: 'rgba(255, 255, 255, 0.35)',
    text: '#2D2E4A',
    isDark: false
  }
];

// App.tsx
const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);

useEffect(() => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', currentTheme.primary);
  root.style.setProperty('--color-secondary', currentTheme.secondary);
  root.style.setProperty('--color-text', currentTheme.text);
  root.style.setProperty('--glass-surface', currentTheme.surface);
  root.style.setProperty('--bg-desktop', 
    currentTheme.wallpaper 
      ? `url(${currentTheme.wallpaper})` 
      : currentTheme.background
  );
}, [currentTheme]);
```

### 示例 3：CSS 样式定义

```css
:root {
  --color-primary: #3E406F;
  --color-secondary: #C1A3B5;
  --color-text: #2D2E4A;
  --glass-surface: rgba(255, 255, 255, 0.35);
  --bg-desktop: linear-gradient(to bottom, #98B0B9, #C1A3B5, #3E406F);
}

.glass {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.glass-dark {
  background: var(--glass-surface);
  backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.bg-desktop-surface {
  background: var(--bg-desktop);
  background-size: cover;
  background-position: center;
}
```

---

## 关键技术点总结

### 配色系统

1. **颜色选择**：
   - 主色调（Primary）：深蓝紫色 `#3E406F`，用于按钮、强调元素
   - 次要色（Secondary）：淡紫粉色 `#C1A3B5`，用于背景渐变
   - 文本色（Text）：深色 `#2D2E4A`，保证可读性
   - 背景渐变：从浅蓝灰到淡紫粉再到深蓝紫的三色渐变

2. **玻璃态效果**：
   - 使用 `backdrop-filter: blur()` 实现背景模糊
   - 半透明背景：`rgba(255, 255, 255, 0.25-0.35)`
   - 半透明边框：`rgba(255, 255, 255, 0.2-0.3)`
   - 圆角：`rounded-[32px]`（32px 大圆角）

3. **阴影效果**：
   - 模态框：`shadow-2xl` 或 `shadow-[0_32px_80px_-20px_rgba(0,0,0,0.2)]`
   - 窗口：`shadow-[0_20px_50px_rgba(0,0,0,0.15)]`

### 动画系统

1. **动画库**：framer-motion v12.23.26

2. **标准动画参数**：
   ```typescript
   transition={{ 
     type: 'spring', 
     stiffness: 300,  // 弹性强度（值越大，动画越快）
     damping: 30      // 阻尼（值越大，反弹越少）
   }}
   ```

3. **常用动画模式**：
   - **弹出动画**：`scale: 0.95 → 1` + `opacity: 0 → 1`
   - **滑入动画**：`y: 20 → 0` + `opacity: 0 → 1` + `scale: 0.9 → 1`
   - **淡入动画**：`opacity: 0 → 1`
   - **布局动画**：使用 `layout` 属性自动处理位置和尺寸变化

4. **动画时机**：
   - 使用 `AnimatePresence` 包裹条件渲染的组件
   - `initial` 定义初始状态
   - `animate` 定义动画目标
   - `exit` 定义退出状态

5. **性能优化**：
   - 使用 `initial={false}` 避免首次渲染动画（如 AIChat 的 layout 动画）
   - 合理使用 `layout` 属性处理布局变化，而不是手动动画每个属性

### 设计规范

1. **圆角大小**：
   - 模态框/对话框：`rounded-[32px]`（32px）
   - 窗口：`rounded-2xl`（1rem / 16px）
   - 按钮：`rounded-2xl` 或 `rounded-[24px]`
   - 小元素：`rounded-xl` 或 `rounded-lg`

2. **间距**：
   - 模态框内边距：`p-6` 或 `p-8`
   - 元素间距：`space-y-4`、`space-y-6`

3. **透明度层级**：
   - 主要文本：`opacity: 1`
   - 次要文本：`opacity: 70-80`
   - 辅助文本：`opacity: 40-60`
   - 背景光晕：`opacity: 5-10`

---

## 使用建议

### 在项目中使用莫奈配色

1. **安装依赖**：
   ```bash
   npm install framer-motion
   ```

2. **复制 CSS 变量和样式类**到你的 `index.html` 或全局样式文件

3. **定义主题配置**，使用提供的颜色值

4. **在根组件中应用主题**，通过 `useEffect` 设置 CSS 变量

5. **使用 Tailwind 类名**：
   - `bg-accent`：主色调背景
   - `text-surface-text`：文本颜色
   - `glass` 或 `glass-dark`：玻璃态效果
   - `rounded-[32px]`：大圆角

### 在项目中使用对话框动画

1. **导入 framer-motion**：
   ```tsx
   import { motion, AnimatePresence } from 'framer-motion';
   ```

2. **使用标准动画模式**：
   - 复制示例代码
   - 保持 `stiffness: 300, damping: 30` 参数一致
   - 使用相同的 `initial`、`animate`、`exit` 值

3. **自定义动画**：
   - 根据需求调整 `scale`、`opacity`、`y` 等值
   - 保持 spring 动画参数一致以维持统一的动画风格

---

## 总结

Forsion Desktop 的 UI 风格特点：

1. **配色**：莫奈印象派风格的柔和渐变配色，以蓝紫色系为主
2. **材质**：玻璃态（Glassmorphism）设计，使用背景模糊和半透明效果
3. **动画**：流畅的 spring 动画，适度的弹性和阻尼
4. **圆角**：大圆角设计（32px），柔和的视觉效果
5. **阴影**：柔和的阴影，增强层次感

遵循以上规范和实现方法，可以在其他 Forsion 项目中复现相同的 UI 风格和动画效果。

