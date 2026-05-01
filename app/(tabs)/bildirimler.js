import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { API_BASE_URL } from '../config';

export default function BildirimSayfasi() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  const calculateTHI = (sicaklik, nem) => {
    const t = Number(sicaklik || 0);
    const rh = Number(nem || 0);
    return (1.8 * t + 32) - (0.55 - 0.0055 * rh) * (1.8 * t - 26);
  };

  const formatTime = (value) => {
    if (!value) return 'Zaman yok';

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value);
      return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(value);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sensor-data`);

      if (!response.ok) {
        throw new Error('Bildirim verileri alınamadı');
      }

      const data = await response.json();
      const sensorData = Array.isArray(data) ? data : [];

      const alerts = [];

      sensorData.forEach((item) => {
        const sicaklik = Number(item.sicaklik || 0);
        const nem = Number(item.nem || 0);
        const amonyak = Number(item.amonyak || 0);
        const thi = calculateTHI(sicaklik, nem);

        const timeValue = item.zaman || item.tarih || item.createdAt;

        if (amonyak >= 25) {
          alerts.push({
            id: `nh3-${item.id}`,
            title: 'Kritik Amonyak Seviyesi',
            desc: `Amonyak değeri ${amonyak} ppm seviyesine ulaştı. Hava kalitesi riskli durumda.`,
            advice: 'Havalandırmayı artırın, altlık temizliğini kontrol edin ve amonyak kaynağını azaltın.',
            time: formatTime(timeValue),
            type: 'kritik',
            icon: 'alert-decagram',
          });
        } else if (amonyak >= 20) {
          alerts.push({
            id: `nh3-warning-${item.id}`,
            title: 'Amonyak Yükseliyor',
            desc: `Amonyak değeri ${amonyak} ppm. Kritik sınıra yaklaşıyor.`,
            advice: 'Ahır havalandırmasını kontrol edin ve ortamı düzenli izleyin.',
            time: formatTime(timeValue),
            type: 'uyari',
            icon: 'wind',
          });
        }

        if (sicaklik >= 28) {
          alerts.push({
            id: `temp-critical-${item.id}`,
            title: 'Yüksek Sıcaklık Riski',
            desc: `Sıcaklık ${sicaklik}°C. Isı stresi riski artıyor.`,
            advice: 'Su erişimini artırın, fan veya serinletme sistemlerini çalıştırın.',
            time: formatTime(timeValue),
            type: 'kritik',
            icon: 'thermometer-alert',
          });
        } else if (sicaklik >= 24) {
          alerts.push({
            id: `temp-warning-${item.id}`,
            title: 'Sıcaklık Uyarısı',
            desc: `Sıcaklık ${sicaklik}°C. Konfor sınırına yaklaşılıyor.`,
            advice: 'Ortam sıcaklığını takip edin ve havalandırmayı hazır tutun.',
            time: formatTime(timeValue),
            type: 'uyari',
            icon: 'thermometer-high',
          });
        }

        if (nem >= 85) {
          alerts.push({
            id: `hum-critical-${item.id}`,
            title: 'Kritik Nem Seviyesi',
            desc: `Nem oranı %${nem}. Yüksek nem solunum ve konfor riskini artırabilir.`,
            advice: 'Havalandırmayı artırın ve ahır içi hava sirkülasyonunu kontrol edin.',
            time: formatTime(timeValue),
            type: 'kritik',
            icon: 'water-alert',
          });
        } else if (nem >= 75) {
          alerts.push({
            id: `hum-warning-${item.id}`,
            title: 'Yüksek Nem Uyarısı',
            desc: `Nem oranı %${nem}. Ahır içi konfor seviyesi düşebilir.`,
            advice: 'Nem takibini sürdürün ve ortamın fazla kapalı kalmamasına dikkat edin.',
            time: formatTime(timeValue),
            type: 'uyari',
            icon: 'water-percent',
          });
        }

        if (thi >= 79) {
          alerts.push({
            id: `thi-critical-${item.id}`,
            title: 'THI Kritik Seviyede',
            desc: `THI değeri ${thi.toFixed(1)}. Hayvanlarda ısı stresi riski yüksektir.`,
            advice: 'Serinletme, gölgelendirme ve su tüketimi kontrolü yapılmalıdır.',
            time: formatTime(timeValue),
            type: 'kritik',
            icon: 'heart-pulse',
          });
        } else if (thi >= 72) {
          alerts.push({
            id: `thi-warning-${item.id}`,
            title: 'THI Riskli Seviyede',
            desc: `THI değeri ${thi.toFixed(1)}. Konfor seviyesi düşmeye başlamış olabilir.`,
            advice: 'Sıcaklık ve nem birlikte takip edilmeli, gerekirse havalandırma artırılmalıdır.',
            time: formatTime(timeValue),
            type: 'uyari',
            icon: 'alert-circle-outline',
          });
        }
      });

      setLogs(alerts.reverse());
      setLastUpdate(new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      }));
    } catch (err) {
      console.error('Bildirim çekme hatası:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const criticalCount = logs.filter((item) => item.type === 'kritik').length;
  const warningCount = logs.filter((item) => item.type === 'uyari').length;

  const renderNotification = ({ item }) => {
    const isCritical = item.type === 'kritik';

    return (
      <View style={[styles.card, isCritical ? styles.criticalCard : styles.warningCard]}>
        <View style={styles.cardTop}>
          <View style={[
            styles.iconBox,
            { backgroundColor: isCritical ? '#fee2e2' : '#fef3c7' },
          ]}>
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={isCritical ? '#ef4444' : '#f59e0b'}
            />
          </View>

          <View style={styles.cardTitleArea}>
            <Text style={styles.titleText}>{item.title}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>

          <View style={[
            styles.typeBadge,
            { backgroundColor: isCritical ? '#fee2e2' : '#fef3c7' },
          ]}>
            <Text style={[
              styles.typeBadgeText,
              { color: isCritical ? '#dc2626' : '#d97706' },
            ]}>
              {isCritical ? 'KRİTİK' : 'UYARI'}
            </Text>
          </View>
        </View>

        <Text style={styles.descText}>{item.desc}</Text>

        <View style={styles.adviceBox}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#16a34a" />
          <Text style={styles.adviceText}>{item.advice}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Akıllı bildirimler hazırlanıyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.headerArea}>
        <View>
          <Text style={styles.pageMiniTitle}>AKILLI AHIR</Text>
          <Text style={styles.headerText}>Bildirimler</Text>
          <Text style={styles.subHeaderText}>
            Sistem tarafından oluşturulan risk ve öneri kayıtları
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Kritik</Text>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{criticalCount}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Uyarı</Text>
          <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{warningCount}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Toplam</Text>
          <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{logs.length}</Text>
        </View>
      </View>

      <Text style={styles.updateText}>
        Son güncelleme: {lastUpdate || 'Henüz yok'}
      </Text>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#22c55e']}
            tintColor="#22c55e"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons name="check-circle-outline" size={72} color="#22c55e" />
            </View>
            <Text style={styles.emptyTitle}>Her Şey Yolunda</Text>
            <Text style={styles.emptyText}>
              Şu an için sıcaklık, nem, amonyak veya THI açısından riskli bir durum yok.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 18,
  },

  centerContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
  },

  headerArea: {
    marginTop: 12,
    marginBottom: 18,
  },

  pageMiniTitle: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  headerText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },

  subHeaderText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
    lineHeight: 20,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  summaryLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },

  summaryValue: {
    fontSize: 25,
    fontWeight: '900',
    marginTop: 4,
  },

  updateText: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 14,
    textAlign: 'right',
  },

  listContent: {
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
  },

  criticalCard: {
    borderColor: 'rgba(239,68,68,0.45)',
  },

  warningCard: {
    borderColor: 'rgba(245,158,11,0.45)',
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  cardTitleArea: {
    flex: 1,
  },

  titleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#f8fafc',
  },

  timeText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '600',
  },

  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  typeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },

  descText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 14,
    lineHeight: 21,
  },

  adviceBox: {
    marginTop: 13,
    backgroundColor: 'rgba(22,163,74,0.10)',
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.18)',
  },

  adviceText: {
    flex: 1,
    color: '#bbf7d0',
    marginLeft: 9,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 24,
  },

  emptyIconBox: {
    width: 110,
    height: 110,
    borderRadius: 35,
    backgroundColor: 'rgba(34,197,94,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#f8fafc',
    marginTop: 18,
  },

  emptyText: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});