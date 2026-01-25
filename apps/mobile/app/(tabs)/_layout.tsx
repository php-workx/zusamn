import { Tabs } from 'expo-router';
import { Text, useTheme } from '@zusamn/ui';

/**
 * Tab icon component using text-based icons.
 * Can be replaced with actual icons (e.g., from @expo/vector-icons) later.
 */
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const theme = useTheme();
  const color = focused ? theme.accent.val : theme.textMuted.val;

  // Simple text-based icons - can be replaced with proper icon library
  const icons: Record<string, string> = {
    lists: '\u2630', // hamburger menu / list icon
    account: '\u263A', // smiley face / person icon
  };

  return (
    <Text fontSize={20} color={color}>
      {icons[name] || '\u25CF'}
    </Text>
  );
}

/**
 * Tab layout with bottom navigation.
 * Implements FR-NAV-001: Two tabs - Lists and Account.
 * Implements FR-NAV-004: Tab bar remains visible on all screens.
 */
export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent.val,
        tabBarInactiveTintColor: theme.textMuted.val,
        tabBarStyle: {
          backgroundColor: theme.surface.val,
          borderTopColor: theme.separator.val,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lists',
          tabBarIcon: ({ focused }) => <TabIcon name="lists" focused={focused} />,
          tabBarAccessibilityLabel: 'Lists tab',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon name="account" focused={focused} />,
          tabBarAccessibilityLabel: 'Account tab',
        }}
      />
    </Tabs>
  );
}
