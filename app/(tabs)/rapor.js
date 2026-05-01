import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { API_BASE_URL } from '../config/api';

export default function RaporOzetSayfasi() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [report, setReport] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');

  const calculateTHI = (t, rh) => {
    return (1.8 * t + 32) - (0.55 - 0.0055 * rh) * (1.8 * t - 26);
  };

  const average = (arr) => {
    if (!arr.length) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  };

  const fetchReport = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sensor-data`);

      if (!response.ok) {
        throw new Error('Rapor verileri alınamadı');
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];

      if (list.length === 0) {
        setReport(null);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const todayData = list.filter((item) => {
        const time = item.zaman || item.tarih || item.createdAt;
        if (!time) return true;
        return String(time).startsWith(today);
      });

      const reportData = todayData.length > 0 ? todayData : list.slice(-30);

      const temperatures = reportData.map((i) => Number(i.sicaklik || 0));
      const humidities = reportData.map((i) => Number(i.nem || 0));
      const ammonias = reportData.map((i) => Number(i.amonyak || 0));
      const lights = reportData.map((i) => Number(i.isik || 0));

      const thiValues = reportData.map((i) =>
        calculateTHI(Number(i.sicaklik || 0), Number(i.nem || 0))
      );

      const maxTemp = Math.max(...temperatures);
      const avgTemp = average(temperatures);
      const avgHumidity = average(humidities);
      const maxAmmonia = Math.max(...ammonias);
      const avgLight = average(lights);
      const avgTHI = average(thiValues);

      const criticalCount = reportData.filter((i) => {
        const t = Number(i.sicaklik || 0);
        const h = Number(i.nem || 0);
        const a = Number(i.amonyak || 0);
        const thi = calculateTHI(t, h);

        return t >= 28 || h >= 85 || a >= 25 || thi >= 79;
      }).length;

      const warningCount = reportData.filter((i) => {
        const t = Number(i.sicaklik || 0);
        const h = Number(i.nem || 0);
        const a = Number(i.amonyak || 0);
        const thi = calculateTHI(t, h);

        const isCritical = t >= 28 || h >= 85 || a >= 25 || thi >= 79;
        const isWarning = t >= 24 || h >= 75 || a >= 20 || thi >= 72;

        return !isCritical && isWarning;
      }).length;

      let status = 'Normal';
      let statusColor = '#22c55e';
      let comment = 'Ahır içi mikroklima genel olarak uygun seviyede görünmektedir.';

      if (criticalCount > 0 || avgTHI >= 79 || maxAmmonia >= 25) {
        status = 'Kritik';
        statusColor = '#ef4444';
        comment =
          'Kritik değerler tespit edildi. Havalandırma, sıcaklık ve amonyak seviyesi kontrol edilmelidir.';
      } else if (warningCount > 0 || avgTHI >= 72 || maxAmmonia >= 20) {
        status = 'Riskli';
        statusColor = '#f59e0b';
        comment =
          'Bazı değerler risk sınırına yaklaşmıştır. Ortam düzenli izlenmeli ve önlem alınmalıdır.';
      }

      setReport({
        total: reportData.length,
        maxTemp,
        avgTemp,
        avgHumidity,
        maxAmmonia,
        avgLight,
        avgTHI,
        criticalCount,
        warningCount,
        status,
        statusColor,
        comment,
      });

      setLastUpdate(
        new Date().toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (error) {
      console.log('Rapor hatası:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Günlük rapor hazırlanıyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22c55e"
            colors={['#22c55e']}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.miniTitle}>AKILLI AHIR</Text>
            <Text style={styles.title}>Rapor & Özet</Text>
            <Text style={styles.subtitle}>
              Günlük mikroklima durumu ve sistem değerlendirmesi
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="file-chart-outline" size={30} color="#22c55e" />
          </View>
        </View>

        {!report ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="database-off-outline" size={64} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Henüz veri yok</Text>
            <Text style={styles.emptyText}>
              Sensörlerden veri geldikçe günlük rapor burada oluşacaktır.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.heroCard, { borderColor: report.statusColor }]}>
              <View>
                <Text style={styles.heroLabel}>Genel Sistem Durumu</Text>
                <Text style={[styles.heroValue, { color: report.statusColor }]}>
                  {report.status}
                </Text>
                <Text style={styles.heroSub}>Son güncelleme: {lastUpdate}</Text>
              </View>

              <View style={[styles.heroIconBox, { backgroundColor: `${report.statusColor}22` }]}>
                <MaterialCommunityIcons
                  name={
                    report.status === 'Kritik'
                      ? 'alert-octagon'
                      : report.status === 'Riskli'
                      ? 'alert-circle'
                      : 'check-circle'
                  }
                  size={42}
                  color={report.statusColor}
                />
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <SummaryCard
                title="Ölçüm"
                value={report.total}
                unit="adet"
                icon="counter"
                color="#22c55e"
              />

              <SummaryCard
                title="Kritik"
                value={report.criticalCount}
                unit="adet"
                icon="alert-octagon"
                color="#ef4444"
              />

              <SummaryCard
                title="Uyarı"
                value={report.warningCount}
                unit="adet"
                icon="alert-circle"
                color="#f59e0b"
              />

              <SummaryCard
                title="THI"
                value={report.avgTHI.toFixed(1)}
                unit="ort."
                icon="heart-pulse"
                color="#38bdf8"
              />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="chart-box-outline" size={25} color="#22c55e" />
                <Text style={styles.cardTitle}>Mikroklima Özeti</Text>
              </View>

              <InfoRow label="Ortalama Sıcaklık" value={`${report.avgTemp.toFixed(1)} °C`} />
              <InfoRow label="En Yüksek Sıcaklık" value={`${report.maxTemp.toFixed(1)} °C`} />
              <InfoRow label="Ortalama Nem" value={`%${report.avgHumidity.toFixed(1)}`} />
              <InfoRow label="En Yüksek Amonyak" value={`${report.maxAmmonia.toFixed(0)} ppm`} />
              <InfoRow label="Ortalama Işık" value={`%${report.avgLight.toFixed(0)}`} />
            </View>

            <View style={styles.commentCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="robot-outline" size={25} color="#22c55e" />
                <Text style={styles.cardTitle}>Sistem Yorumu</Text>
              </View>

              <Text style={styles.commentText}>{report.comment}</Text>
            </View>

            <View style={styles.noteCard}>
              <MaterialCommunityIcons name="information-outline" size={23} color="#38bdf8" />
              <Text style={styles.noteText}>
                Bu rapor canlı sensör verilerinden oluşturulur. Geçmiş veri analizi ve makine öğrenmesi raporlarından farklı olarak anlık sistem durumunu özetler.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ title, value, unit, icon, color }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}22` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>

      <Text style={styles.summaryTitle}>{title}</Text>

      <View style={styles.summaryValueRow}>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  scroll: {
    padding: 18,
    paddingBottom: 42,
  },

  center: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#cbd5e1',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },

  header: {
    marginTop: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  miniTitle: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },

  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
    maxWidth: 260,
  },

  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 26,
    alignItems: 'center',
    marginTop: 40,
  },

  emptyTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 14,
  },

  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },

  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heroLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },

  heroValue: {
    fontSize: 36,
    fontWeight: '900',
    marginTop: 5,
  },

  heroSub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 5,
  },

  heroIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },

  summaryCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 17,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  summaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  summaryTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },

  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 5,
  },

  summaryValue: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
  },

  summaryUnit: {
    color: '#cbd5e1',
    fontSize: 13,
    marginLeft: 5,
    marginBottom: 5,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#0f172a',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 10,
  },

  infoRow: {
    backgroundColor: '#111827',
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },

  infoValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },

  commentCard: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.18)',
    marginBottom: 16,
  },

  commentText: {
    color: '#bbf7d0',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },

  noteCard: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.18)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  noteText: {
    flex: 1,
    color: '#bae6fd',
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
});