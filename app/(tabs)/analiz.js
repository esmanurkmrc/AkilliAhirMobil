import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config";

const { width } = Dimensions.get("window");

export default function AnomaliAnalizPage() {
  const router = useRouter();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionLogs, setActionLogs] = useState([]);
  const [stats, setStats] = useState({
    kritik: 0,
    uyari: 0,
    saglik: 100,
  });

  const calculateThi = (t, rh) => {
    const value = 0.8 * t + (rh / 100) * (t - 14.4) + 46.4;
    return Number(value.toFixed(1));
  };

  const detectAnomalies = useCallback(async () => {
    try {
      const [prodResponse, sensorResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analysis-productivity`),
        fetch(`${API_BASE_URL}/api/sensor-data`),
      ]);

      const prodData = prodResponse.ok ? await prodResponse.json() : [];
      const sensorData = sensorResponse.ok ? await sensorResponse.json() : [];

      const prodRes = Array.isArray(prodData) ? prodData : [];
      const sensorRes = Array.isArray(sensorData) ? sensorData : [];

      const lastSensorData = sensorRes.slice(-20);
      const lastProdData = prodRes.slice(-20);

      const foundAnomalies = [];
      let kritikCount = 0;
      let uyariCount = 0;

      lastSensorData.forEach((env) => {
        const sicaklik = Number(env.sicaklik || 0);
        const nem = Number(env.nem || 0);
        const amonyak = Number(env.amonyak || 0);
        const thi = calculateThi(sicaklik, nem);

        if (amonyak >= 25) {
          kritikCount++;
          foundAnomalies.push({
            id: `nh3-${env.id}`,
            level: "KRİTİK",
            title: "Kritik Amonyak Seviyesi",
            desc: `Amonyak ${amonyak} ppm seviyesine ulaştı. Havalandırma kontrol edilmelidir.`,
            icon: "weather-windy",
            color: "#7e22ce",
            bg: "#faf5ff",
            link: "/sensor",
          });
        } else if (amonyak >= 20) {
          uyariCount++;
          foundAnomalies.push({
            id: `nh3-uyari-${env.id}`,
            level: "UYARI",
            title: "Amonyak Seviyesi Yükseliyor",
            desc: `Amonyak ${amonyak} ppm. Kritik sınıra yaklaşmadan ortam kontrol edilmelidir.`,
            icon: "weather-windy",
            color: "#f59e0b",
            bg: "#fffbeb",
            link: "/sensor",
          });
        }

        if (thi >= 72) {
          kritikCount++;
          foundAnomalies.push({
            id: `thi-${env.id}`,
            level: "KRİTİK",
            title: "Isı Stresi Riski",
            desc: `THI değeri ${thi}. Hayvan konforu riskli seviyeye ulaşmış olabilir.`,
            icon: "thermometer-alert",
            color: "#ef4444",
            bg: "#fef2f2",
            link: "/sensor",
          });
        } else if (sicaklik >= 30) {
          uyariCount++;
          foundAnomalies.push({
            id: `isi-${env.id}`,
            level: "UYARI",
            title: "Sıcaklık Yükseliyor",
            desc: `Sıcaklık ${sicaklik}°C. Isı stresi oluşmadan önlem alınmalıdır.`,
            icon: "thermometer",
            color: "#ea580c",
            bg: "#fff7ed",
            link: "/sensor",
          });
        }
      });

      lastProdData.forEach((prod) => {
        const sut = Number(prod.sutVerimi || 0);
        const yem = Number(prod.yemTuketimi || 0);

        if (sut > 0 && sut < 3) {
          kritikCount++;
          foundAnomalies.push({
            id: `sut-${prod.id}`,
            level: "KRİTİK",
            title: "Düşük Süt Verimi",
            desc: `Süt verimi ${sut} L seviyesinde. Hayvan verimi düşük görünmektedir.`,
            icon: "cow",
            color: "#ef4444",
            bg: "#fef2f2",
            link: "/sut",
          });
        } else if (sut >= 3 && sut < 4) {
          uyariCount++;
          foundAnomalies.push({
            id: `sut-uyari-${prod.id}`,
            level: "UYARI",
            title: "Orta Seviye Verim",
            desc: `Süt verimi ${sut} L. Verim takibi yapılması önerilir.`,
            icon: "chart-bell-curve-cumulative",
            color: "#f59e0b",
            bg: "#fffbeb",
            link: "/sut",
          });
        }

        if (yem > 0 && sut > 0 && sut / yem < 0.45) {
          uyariCount++;
          foundAnomalies.push({
            id: `oran-${prod.id}`,
            level: "UYARI",
            title: "Yem/Süt Verim Oranı Düşük",
            desc: `Yem tüketimine göre süt verimi düşük. Beslenme ve ortam koşulları incelenmelidir.`,
            icon: "chart-line-variant",
            color: "#2563eb",
            bg: "#eff6ff",
            link: "/sut",
          });
        }
      });

      const healthScore = Math.max(0, 100 - kritikCount * 12 - uyariCount * 5);

      setAlerts(foundAnomalies.reverse().slice(0, 8));
      setStats({
        kritik: kritikCount,
        uyari: uyariCount,
        saglik: healthScore,
      });
    } catch (err) {
      console.error("Analiz hatası:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    detectAnomalies();
  }, [detectAnomalies]);

  const onRefresh = () => {
    setRefreshing(true);
    detectAnomalies();
  };

  const handleAction = (title) => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString("tr-TR").slice(0, 5),
      action: `${title} için müdahale başlatıldı.`,
    };

    setActionLogs([newLog, ...actionLogs]);

    Alert.alert(
      "Başarılı",
      "Müdahale protokolü başlatıldı ve geçmişe kaydedildi."
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Anomali analizi yapılıyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerBox}>
          <Text style={styles.pageMiniTitle}>AKILLI AHIR</Text>
          <Text style={styles.pageTitle}>Sistem Zekası</Text>
          <Text style={styles.pageDesc}>
            Canlı sensör verileri ve analiz verileri üzerinden kritik durum
            denetimi yapılır.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderBottomColor: "#ef4444" }]}>
            <Text style={styles.statLabel}>KRİTİK</Text>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>
              {stats.kritik}
            </Text>
          </View>

          <View style={[styles.statCard, { borderBottomColor: "#f59e0b" }]}>
            <Text style={styles.statLabel}>UYARI</Text>
            <Text style={[styles.statValue, { color: "#f59e0b" }]}>
              {stats.uyari}
            </Text>
          </View>

          <View style={[styles.statCard, { borderBottomColor: "#3b82f6" }]}>
            <Text style={styles.statLabel}>SAĞLIK</Text>
            <Text style={[styles.statValue, { color: "#3b82f6" }]}>
              %{stats.saglik}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🧠 Akıllı Anomali Raporu</Text>

        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertCard,
                { backgroundColor: alert.bg, borderColor: alert.color + "33" },
              ]}
            >
              <View style={styles.alertHeader}>
                <MaterialCommunityIcons
                  name={alert.icon}
                  size={24}
                  color={alert.color}
                />
                <Text style={[styles.levelLabel, { color: alert.color }]}>
                  {alert.level}
                </Text>
              </View>

              <Text style={styles.cardTitle}>{alert.title}</Text>
              <Text style={styles.cardDesc}>{alert.desc}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.push(alert.link)}
                >
                  <Text style={styles.secondaryBtnText}>Detay</Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={14}
                    color="#475569"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => handleAction(alert.title)}
                >
                  <Text style={styles.primaryBtnText}>Aksiyon Al</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.successCard}>
            <MaterialCommunityIcons
              name="check-circle"
              size={34}
              color="#16a34a"
            />
            <Text style={styles.successTitle}>Anomali Tespit Edilmedi</Text>
            <Text style={styles.successDesc}>
              Son verilerde kritik bir durum görünmüyor. Sistem normal
              çalışıyor.
            </Text>
          </View>
        )}

        <View style={styles.aiNote}>
          <MaterialCommunityIcons name="brain" size={22} color="#7c3aed" />
          <Text style={styles.aiNoteText}>
            Bu ekran canlı sensör verilerinden amonyak, sıcaklık ve THI
            risklerini; analiz veri setinden ise süt/yem verim anomalilerini
            kontrol eder.
          </Text>
        </View>

        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>📋 Müdahale Geçmişi</Text>

          <View style={styles.logContainer}>
            {actionLogs.length > 0 ? (
              actionLogs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <Text style={styles.logTime}>{log.time}</Text>
                  <Text style={styles.logText} numberOfLines={1}>
                    {log.action}
                  </Text>
                  <Text style={styles.logStatus}>OK</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyLog}>
                Henüz bir müdahale kaydı yok.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontWeight: "700",
  },
  scrollContent: { padding: 20, paddingBottom: 45 },
  headerBox: {
    backgroundColor: "#111827",
    padding: 22,
    borderRadius: 24,
    marginBottom: 20,
  },
  pageMiniTitle: {
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  pageTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 5,
  },
  pageDesc: {
    color: "#cbd5e1",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: "#fff",
    width: (width - 60) / 3,
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    borderBottomWidth: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
  },
  statLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "900",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 15,
    marginTop: 10,
  },
  alertCard: {
    padding: 20,
    borderRadius: 22,
    marginBottom: 15,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
  },
  cardDesc: {
    fontSize: 14,
    color: "#475569",
    marginTop: 6,
    lineHeight: 21,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  secondaryBtnText: {
    color: "#475569",
    fontWeight: "900",
    fontSize: 12,
    marginRight: 5,
  },
  successCard: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    marginBottom: 18,
  },
  successTitle: {
    fontSize: 18,
    color: "#166534",
    fontWeight: "900",
    marginTop: 10,
  },
  successDesc: {
    color: "#166534",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },
  aiNote: {
    flexDirection: "row",
    backgroundColor: "#f5f3ff",
    borderWidth: 1,
    borderColor: "#ddd6fe",
    padding: 16,
    borderRadius: 18,
    marginTop: 8,
  },
  aiNoteText: {
    flex: 1,
    marginLeft: 10,
    color: "#5b21b6",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  logSection: { marginTop: 25 },
  logContainer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  logTime: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    width: 45,
  },
  logText: {
    flex: 1,
    fontSize: 13,
    color: "#1e293b",
    paddingHorizontal: 10,
    fontWeight: "600",
  },
  logStatus: {
    fontSize: 10,
    fontWeight: "900",
    color: "#16a34a",
    backgroundColor: "#f0fdf4",
    padding: 5,
    borderRadius: 6,
  },
  emptyLog: {
    textAlign: "center",
    padding: 20,
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
});