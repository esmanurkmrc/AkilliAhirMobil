import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '../config/api';

const screenWidth = Dimensions.get('window').width;

export default function CanliEkrani() {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [hata, setHata] = useState(null);
  const [sonGuncelleme, setSonGuncelleme] = useState('');

  const [grafikData, setGrafikData] = useState({
    labels: [],
    sicaklik: [],
    nem: [],
    amonyak: [],
  });

  const hesaplaTHI = (sicaklik, nem) => {
    const t = Number(sicaklik || 0);
    const rh = Number(nem || 0);
    return (1.8 * t + 32) - (0.55 - 0.0055 * rh) * (1.8 * t - 26);
  };

  const getDurum = () => {
    if (!veri || hata) {
      return {
        text: 'Veri Yok',
        color: '#94a3b8',
        bg: 'rgba(148,163,184,0.12)',
        icon: 'wifi-off',
      };
    }

    const sicaklik = Number(veri.sicaklik || 0);
    const nem = Number(veri.nem || 0);
    const amonyak = Number(veri.amonyak || 0);
    const thi = hesaplaTHI(sicaklik, nem);

    if (amonyak >= 25 || sicaklik >= 28 || nem >= 85 || thi >= 79) {
      return {
        text: 'Kritik',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.14)',
        icon: 'alert-octagon',
      };
    }

    if (amonyak >= 20 || sicaklik >= 24 || nem >= 75 || thi >= 72) {
      return {
        text: 'Riskli',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.14)',
        icon: 'alert-circle',
      };
    }

    return {
      text: 'Normal',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.14)',
      icon: 'check-circle',
    };
  };

  const verileriGetir = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sensor-data/son`);

      if (!response.ok) {
        throw new Error('Son sensör verisi alınamadı');
      }

      const json = await response.json();

      setVeri(json);
      setHata(null);

      const saat = new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      setGrafikData((prev) => ({
        labels: [...prev.labels, saat].slice(-6),
        sicaklik: [...prev.sicaklik, Number(json.sicaklik || 0)].slice(-6),
        nem: [...prev.nem, Number(json.nem || 0)].slice(-6),
        amonyak: [...prev.amonyak, Number(json.amonyak || 0)].slice(-6),
      }));

      setSonGuncelleme(
        new Date().toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err) {
      console.log('Bağlantı Hatası:', err.message);
      setHata('Sunucuya bağlanılamıyor');
    } finally {
      setYukleniyor(false);
      setYenileniyor(false);
    }
  }, []);

  useEffect(() => {
    verileriGetir();

    const interval = setInterval(() => {
      verileriGetir();
    }, 5000);

    return () => clearInterval(interval);
  }, [verileriGetir]);

  const onRefresh = () => {
    setYenileniyor(true);
    verileriGetir();
  };

  if (yukleniyor) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Canlı sensör verileri okunuyor...</Text>
      </View>
    );
  }

  const sicaklik = Number(veri?.sicaklik || 0);
  const nem = Number(veri?.nem || 0);
  const amonyak = Number(veri?.amonyak || 0);
  const isik = Number(veri?.isik || 0);
  const thi = hesaplaTHI(sicaklik, nem);
  const genelDurum = getDurum();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={yenileniyor}
            onRefresh={onRefresh}
            tintColor="#22c55e"
            colors={['#22c55e']}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.miniTitle}>AKILLI AHIR</Text>
            <Text style={styles.title}>Canlı İzleme</Text>
            <Text style={styles.subtitle}>ESP32 sensörlerinden gelen son ortam verileri</Text>
          </View>

          <View style={[styles.liveBadge, { backgroundColor: hata ? '#3f1d1d' : '#052e16' }]}>
            <View style={[styles.liveDot, { backgroundColor: hata ? '#ef4444' : '#22c55e' }]} />
            <Text style={[styles.liveText, { color: hata ? '#fecaca' : '#bbf7d0' }]}>
              {hata ? 'Offline' : 'Live'}
            </Text>
          </View>
        </View>

        <View style={[styles.heroCard, { borderColor: genelDurum.color }]}>
          <View>
            <Text style={styles.heroLabel}>Genel Mikroklima Durumu</Text>
            <Text style={[styles.heroValue, { color: genelDurum.color }]}>
              {genelDurum.text}
            </Text>
            <Text style={styles.heroSub}>
              Son güncelleme: {sonGuncelleme || 'Henüz yok'}
            </Text>
          </View>

          <View style={[styles.heroIconBox, { backgroundColor: genelDurum.bg }]}>
            <MaterialCommunityIcons
              name={genelDurum.icon}
              size={42}
              color={genelDurum.color}
            />
          </View>
        </View>

        {hata && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="wifi-off" size={22} color="#ef4444" />
            <Text style={styles.errorText}>
              Spring Boot açık mı, telefon ve bilgisayar aynı ağa bağlı mı kontrol et.
            </Text>
          </View>
        )}

        <View style={styles.grid}>
          <SensorCard
            title="Sıcaklık"
            value={sicaklik ? sicaklik.toFixed(1) : '0.0'}
            unit="°C"
            icon="thermometer"
            color="#f97316"
            status={sicaklik >= 28 ? 'Kritik' : sicaklik >= 24 ? 'Uyarı' : 'Normal'}
          />

          <SensorCard
            title="Nem"
            value={nem ? nem.toFixed(1) : '0.0'}
            unit="%"
            icon="water-percent"
            color="#38bdf8"
            status={nem >= 85 ? 'Kritik' : nem >= 75 ? 'Uyarı' : 'Normal'}
          />

          <SensorCard
            title="Amonyak"
            value={amonyak ? amonyak.toFixed(0) : '0'}
            unit="ppm"
            icon="chemical-weapon"
            color="#a855f7"
            status={amonyak >= 25 ? 'Kritik' : amonyak >= 20 ? 'Uyarı' : 'Normal'}
          />

          <SensorCard
            title="Işık"
            value={isik ? isik.toFixed(0) : '0'}
            unit="%"
            icon="white-balance-sunny"
            color="#eab308"
            status={isik < 20 ? 'Düşük' : 'Normal'}
          />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.thiHeader}>
            <View>
              <Text style={styles.cardMini}>ANLIK VERİ GRAFİĞİ</Text>
              <Text style={styles.cardTitle}>Son Ölçümler</Text>
            </View>
            <MaterialCommunityIcons name="chart-line" size={30} color="#38bdf8" />
          </View>

          {grafikData.sicaklik.length > 1 ? (
            <>
              <LineChart
                data={{
                  labels: grafikData.labels,
                  datasets: [
                    {
                      data: grafikData.sicaklik,
                    },
                    {
                      data: grafikData.nem,
                    },
                  ],
                  legend: ['Sıcaklık', 'Nem'],
                }}
                width={screenWidth - 72}
                height={225}
                yAxisSuffix=""
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />

              <Text style={styles.chartNote}>
                Amonyak: {amonyak.toFixed(0)} ppm · Işık: %{isik.toFixed(0)}
              </Text>
            </>
          ) : (
            <Text style={styles.chartEmpty}>Grafik için en az 2 ölçüm bekleniyor...</Text>
          )}
        </View>

        <View style={styles.thiCard}>
          <View style={styles.thiHeader}>
            <View>
              <Text style={styles.cardMini}>ISI STRESİ ANALİZİ</Text>
              <Text style={styles.cardTitle}>THI Değeri</Text>
            </View>
            <MaterialCommunityIcons name="heart-pulse" size={30} color="#22c55e" />
          </View>

          <View style={styles.thiRow}>
            <Text style={styles.thiValue}>{thi.toFixed(1)}</Text>
            <Text style={styles.thiText}>
              {thi >= 79
                ? 'Kritik ısı stresi riski'
                : thi >= 72
                ? 'Riskli konfor seviyesi'
                : 'Konforlu ortam'}
            </Text>
          </View>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((thi / 90) * 100, 100)}%`,
                  backgroundColor:
                    thi >= 79 ? '#ef4444' : thi >= 72 ? '#f59e0b' : '#22c55e',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="access-point" size={24} color="#22c55e" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Veri Akışı</Text>
            <Text style={styles.infoText}>
              ESP32 her 5 saniyede backend’e veri gönderir. Bu ekran da son kaydı 5 saniyede bir yeniler.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SensorCard({ title, value, unit, icon, color, status }) {
  const statusColor =
    status === 'Kritik'
      ? '#ef4444'
      : status === 'Uyarı' || status === 'Düşük'
      ? '#f59e0b'
      : '#22c55e';

  return (
    <View style={styles.sensorCard}>
      <View style={[styles.sensorIcon, { backgroundColor: `${color}22` }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>

      <Text style={styles.sensorTitle}>{title}</Text>

      <View style={styles.valueRow}>
        <Text style={styles.sensorValue}>{value}</Text>
        <Text style={styles.sensorUnit}>{unit}</Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
      </View>
    </View>
  );
}

const chartConfig = {
  backgroundColor: '#0f172a',
  backgroundGradientFrom: '#0f172a',
  backgroundGradientTo: '#0f172a',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(203, 213, 225, ${opacity})`,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#22c55e',
  },
};

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
    maxWidth: 250,
    lineHeight: 20,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginRight: 7,
  },

  liveText: {
    fontSize: 12,
    fontWeight: '900',
  },

  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    marginBottom: 14,
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
    fontSize: 34,
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

  errorBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    padding: 14,
    borderRadius: 18,
    marginBottom: 14,
    alignItems: 'center',
  },

  errorText: {
    flex: 1,
    color: '#fecaca',
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },

  sensorCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 17,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  sensorIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  sensorTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 5,
  },

  sensorValue: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
  },

  sensorUnit: {
    color: '#cbd5e1',
    fontSize: 14,
    marginLeft: 4,
    marginBottom: 5,
    fontWeight: '700',
  },

  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },

  chartCard: {
    backgroundColor: '#0f172a',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },

  chart: {
    marginTop: 18,
    borderRadius: 18,
  },

  chartEmpty: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  chartNote: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
  },

  thiCard: {
    backgroundColor: '#0f172a',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },

  thiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardMini: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  cardTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 3,
  },

  thiRow: {
    marginTop: 18,
  },

  thiValue: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
  },

  thiText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },

  progressBg: {
    height: 11,
    backgroundColor: '#1e293b',
    borderRadius: 999,
    marginTop: 16,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.18)',
    borderRadius: 22,
    padding: 16,
    alignItems: 'flex-start',
  },

  infoTitle: {
    color: '#dcfce7',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 10,
  },

  infoText: {
    color: '#bbf7d0',
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 10,
    marginTop: 4,
  },
});