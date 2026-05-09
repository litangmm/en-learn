# BadgePanel & BadgeUnlockToast Design

## Overview
Achievement badge showcase panel and unlock notification toast for the English vocabulary learning app.

## Components

### BadgePanel

**Props:**
```typescript
interface BadgePanelProps {
  unlockedIds: Set<string>;
  getProgress: (id: string) => number;
  onBack: () => void;
}
```

**Structure:**
1. **Header**: Back button (ChevronLeft), Award icon, '成就徽章' title, count badge (e.g., '3/12')
2. **Category sections**: Group badges by `BadgeCategory` with optional section headers
3. **Grid layout**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4`
4. **Badge cards**: Each shows 48px icon area, title, description

**Card states:**
- **Unlocked**: `border-amber-400`, `text-amber-500` icon, subtle amber background, displays unlock date formatted as 'YYYY-MM-DD 解锁'
- **Locked**: `border-slate-200`, `text-slate-300` icon, no date, bottom thin progress bar showing progress percent

**Responsive container**: `px-3 md:px-4 py-4 md:py-8`

**Icon rendering**: Static mapping object from `icon` string name to imported Lucide component. Icons used: Footprints, CheckCircle2, Flame, Trophy, BookOpen, Star, RefreshCw, Target.

### BadgeUnlockToast

**Props:**
```typescript
interface BadgeUnlockToastProps {
  badge: BadgeDefinition | null;
  onDismiss: () => void;
}
```

**Structure:**
1. Fixed position bottom-center: `fixed bottom-8 left-1/2 -translate-x-1/2 z-50`
2. AnimatePresence + motion.div animation: initial `{y: 50, opacity: 0}`, animate `{y: 0, opacity: 1}`, exit `{y: 30, opacity: 0}` with spring transition
3. Card: amber/golden gradient border, white bg, shadow-lg, max-w-sm
4. Content: Sparkles icon, '解锁新成就！' header, badge icon + title + description
5. Auto-dismiss after 3000ms via useEffect + setTimeout
6. Click to dismiss early
7. Renders null when badge is null

## Tests

### BadgePanel.test.tsx
- Renders header with '成就徽章' and count
- Renders all 12 badge cards
- Unlocked badge shows amber border and date
- Locked badge shows gray border and progress bar
- Progress bar width matches getProgress return value
- Back button calls onBack
- Category sections render correctly

### BadgeUnlockToast.test.tsx
- Renders null when badge is null
- Shows content when badge is present
- Auto-dismisses after timeout
- Click dismisses early
- Animation presence wrapper

## Dependencies
- framer-motion (AnimatePresence, motion)
- lucide-react (icons)
- @testing-library/react, vitest (testing)
