import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: isDark ? '#111827' : '#0f172a',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.06)',
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="canli"
        options={{
          title: 'Canlı',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="pulse" size={size + 4} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tahmin"
        options={{
          title: 'AI Tahmin',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="brain" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="hayvanlar"
        options={{
          title: 'Hayvanlar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cow" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ayarlar"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="sensor"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="analiz"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="bildirimler"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="rapor"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="sut"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
  name="index"
  options={{
    href: null,
  }}
/>

<Tabs.Screen
  name="explore"
  options={{
    href: null,
  }}
/>

      <Tabs.Screen
        name="korelasyon"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}