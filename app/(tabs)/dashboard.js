import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE_URL } from "../config";

const { width } = Dimensions.get("window");

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    amonyak: 0,
    sicaklik: 0,
    nem: 0,
    thi: 0,
    riskSkoru: 0,
    gunlukSutVerimi: 0,
    durumMesaji: "Veriler alınıyor...",
  });

  const calculateThi = (t, rh) => {
    const value = 0.8 * t + (rh / 100) * (t - 14.4) + 46.4;
    return Number(value.toFixed(1));
  };

  const calculateRiskScore = (t, rh, nh3, thi) => {
    let score = 0;

    if (nh3 >= 25) score += 35;
    else if (nh3 >= 20) score += 20;

    if (thi >= 72) score += 30;
    else if (thi >= 68) score += 15;

    if (t >= 30 || t <= 10) score += 20;
    if (rh >= 80 || rh <= 35) score += 15;

    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const getStatusMessage = (risk, nh3, thi) => {
    if (nh3 >= 25) return "Amonyak seviyesi kritik";
    if (thi >= 72) return "Isı stresi riski mevcut";
    if (risk >= 50) return "Ortam koşulları dikkat gerektiriyor";
    return "Sistem normal çalışıyor";
  };

  const fetchStats = useCallback(async () => {
    try {
      const [sensorResponse, prodResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/sensor-data/son`),
        fetch(`${API_BASE_URL}/api/analysis-productivity`),
      ]);

      const sensorData = sensorResponse.ok ? await sensorResponse.json() : null;
      const prodData = prodResponse.ok ? await prodResponse.json() : [];

      const sicaklik = Number(sensorData?.sicaklik || 0);
      const nem = Number(sensorData?.nem || 0);
      const amonyak = Number(sensorData?.amonyak || 0);

      const thiValue = calculateThi(sicaklik, nem);
      const risk = calculateRiskScore(sicaklik, nem, amonyak, thiValue);

      let gunlukSutVerimi = 0;

      if (Array.isArray(prodData) && prodData.length > 0) {
        const sortedDates = [...new Set(prodData.map((item) => item.tarih))]
          .filter(Boolean)
          .sort((a, b) => new Date(b) - new Date(a));

        const latestDate = sortedDates[0];

        gunlukSutVerimi = prodData
          .filter((item) => item.tarih === latestDate)
          .reduce((sum, item) => sum + Number(item.sutVerimi || 0), 0);
      }

      setStats({
        amonyak,
        sicaklik,
        nem,
        thi: thiValue,
        riskSkoru: risk,
        gunlukSutVerimi,
        durumMesaji: getStatusMessage(risk, amonyak, thiValue),
      });
    } catch (error) {
      console.log("Dashboard veri hatası:", error);
      setStats((prev) => ({
        ...prev,
        durumMesaji: "Sunucuya bağlanılamadı",
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { text: "Evet", onPress: () => router.replace("/login") },
    ]);
  };

  const smsGonder = () => {
    const tel = "05XXXXXXXXX";
    const mesaj = `🚨 AKILLI AHIR UYARISI: Amonyak seviyesi ${stats.amonyak.toFixed(
      1
    )} ppm, THI değeri ${stats.thi.toFixed(1)} olarak ölçüldü. Lütfen kontrol edin.`;

    const separator = Platform.OS === "ios" ? "&" : "?";
    const url = `sms:${tel}${separator}body=${encodeURIComponent(mesaj)}`;

    Linking.openURL(url).catch((err) => console.log("SMS hatası:", err));
  };

  const getSystemStatus = () => {
    if (stats.amonyak >= 25 || stats.thi >= 72 || stats.riskSkoru >= 75) {
      return {
        label: "KRİTİK",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.12)",
      };
    }

    if (stats.riskSkoru >= 40 || stats.amonyak >= 20 || stats.thi >= 68) {
      return {
        label: "RİSKLİ",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.12)",
      };
    }

    return {
      label: "UYGUN",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.12)",
    };
  };

  const getAmonyakColor = () => {
    if (stats.amonyak >= 25) return "#ef4444";
    if (stats.amonyak >= 20) return "#f59e0b";
    return "#22c55e";
  };

  const getThiColor = () => {
    if (stats.thi >= 72) return "#ef4444";
    if (stats.thi >= 68) return "#f59e0b";
    return "#22c55e";
  };

  const getRiskColor = (val) => {
    if (val >= 75) return "#ef4444";
    if (val >= 40) return "#f59e0b";
    return "#38bdf8";
  };

  const safeRiskWidth = Math.min(Math.max(stats.riskSkoru, 0), 100);
  const systemStatus = getSystemStatus();
  const isCritical = stats.amonyak >= 25 || stats.thi >= 72;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loaderText}>Dashboard yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerSmall}>Ahır Durumu</Text>
              <Text style={styles.headerTitle}>Ağıl 1</Text>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={22} color="#f87171" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerBottomRow}>
            <View
              style={[
                styles.systemChip,
                { backgroundColor: systemStatus.bg },
              ]}
            >
              <View
                style={[
                  styles.systemChipDot,
                  { backgroundColor: systemStatus.color },
                ]}
              />
              <Text
                style={[
                  styles.systemChipText,
                  { color: systemStatus.color },
                ]}
              >
                {systemStatus.label}
              </Text>
            </View>

            <Text style={styles.headerMessage} numberOfLines={1}>
              {stats.durumMesaji}
            </Text>
          </View>
        </View>

        {isCritical && (
          <View style={styles.alertCard}>
            <View style={styles.alertTop}>
              <View style={styles.alertIconWrap}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={24}
                  color="#fff"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Kritik Uyarı</Text>
                <Text style={styles.alertDesc}>
                  {stats.amonyak >= 25
                    ? `Amonyak seviyesi tehlikeli: ${stats.amonyak.toFixed(
                        1
                      )} ppm`
                    : `THI değeri riskli: ${stats.thi.toFixed(1)}`}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.alertButton} onPress={smsGonder}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={18}
                color="#fff"
              />
              <Text style={styles.alertButtonText}>Veterinere SMS Gönder</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anlık Değerler</Text>

          <View style={styles.statsGrid}>
            <StatCard
              label="Amonyak"
              value={stats.amonyak.toFixed(1)}
              unit="ppm"
              color={getAmonyakColor()}
              icon="molecule"
            />

            <StatCard
              label="THI"
              value={stats.thi.toFixed(1)}
              unit=""
              color={getThiColor()}
              icon="heart-pulse"
            />
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              label="Sıcaklık"
              value={stats.sicaklik.toFixed(1)}
              unit="°C"
              color="#fb7185"
              icon="thermometer"
            />

            <StatCard
              label="Nem"
              value={stats.nem.toFixed(1)}
              unit="%"
              color="#38bdf8"
              icon="water-percent"
            />
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              label="Son Gün Süt"
              value={stats.gunlukSutVerimi.toFixed(1)}
              unit="L"
              color="#a78bfa"
              icon="cow"
            />

            <StatCard
              label="Risk"
              value={stats.riskSkoru.toFixed(0)}
              unit="%"
              color={getRiskColor(stats.riskSkoru)}
              icon="shield-alert"
            />
          </View>
        </View>

        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <View>
              <Text style={styles.riskTitle}>Genel Sistem Riski</Text>
              <Text style={styles.riskSubtitle}>
                Amonyak, sıcaklık, nem ve THI değerlerine göre
              </Text>
            </View>

            <Text
              style={[
                styles.riskPercent,
                { color: getRiskColor(stats.riskSkoru) },
              ]}
            >
              %{stats.riskSkoru.toFixed(0)}
            </Text>
          </View>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${safeRiskWidth}%`,
                  backgroundColor: getRiskColor(stats.riskSkoru),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>

          <View style={styles.quickGrid}>
            <QuickButton
              icon="chart-line"
              label="Analiz"
              color="#60a5fa"
              onPress={() => router.push("/analiz")}
            />

            <QuickButton
              icon="robot-outline"
              label="Tahmin"
              color="#8b5cf6"
              onPress={() => router.push("/tahmin")}
            />

            <QuickButton
              icon="access-point"
              label="Sensörler"
              color="#22c55e"
              onPress={() => router.push("/sensor")}
            />
            <QuickButton
  icon="robot-happy-outline"
  label="Anlık Verim Analizi"
  color="#06b6d4"
  onPress={() => router.push("/AnlikVerimAnaliz")}
/>

            <QuickButton
              icon="bell-outline"
              label="Bildirim"
              color="#fb7185"
              onPress={() => router.push("/bildirimler")}
            />

            <QuickButton
              icon="file-chart-outline"
              label="Rapor"
              color="#a78bfa"
              onPress={() => router.push("/rapor")}
            />

            <QuickButton
              icon="cog-outline"
              label="Ayarlar"
              color="#fbbf24"
              onPress={() => router.push("/ayarlar")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ label, value, unit, color, icon }) => (
  <View style={styles.statCard}>
    <View style={styles.statCardTop}>
      <Text style={styles.statLabel}>{label}</Text>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
    </View>

    <Text style={[styles.statValue, { color }]}>
      {value} <Text style={styles.statUnit}>{unit}</Text>
    </Text>
  </View>
);

const QuickButton = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.quickButton} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.quickIconWrap, { backgroundColor: `${color}22` }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 30 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, color: "#cbd5e1", fontSize: 15 },

  headerCard: {
    backgroundColor: "#162033",
    borderRadius: 24,
    padding: 18,
    marginTop: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerSmall: { color: "#94a3b8", fontSize: 13, marginBottom: 4 },
  headerTitle: { color: "#ffffff", fontSize: 28, fontWeight: "800" },
  logoutBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(248,113,113,0.08)",
  },
  headerBottomRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  systemChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  systemChipDot: { width: 8, height: 8, borderRadius: 8, marginRight: 8 },
  systemChipText: { fontSize: 12, fontWeight: "700" },
  headerMessage: {
    color: "#cbd5e1",
    fontSize: 12,
    flex: 1,
    textAlign: "right",
    marginLeft: 10,
  },

  alertCard: {
    backgroundColor: "#ef4444",
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },
  alertTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  alertIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertTitle: { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 2 },
  alertDesc: { color: "#fff", fontSize: 13, opacity: 0.95 },
  alertButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.14)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  alertButtonText: { color: "#fff", fontSize: 14, fontWeight: "700", marginLeft: 8 },

  section: { marginBottom: 20 },
  sectionTitle: { color: "#ffffff", fontSize: 22, fontWeight: "800", marginBottom: 14 },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: "#1a2436",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  statCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  statLabel: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  statValue: { fontSize: 28, fontWeight: "800" },
  statUnit: { color: "#cbd5e1", fontSize: 14, fontWeight: "500" },

  riskCard: {
    backgroundColor: "#1a2436",
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  riskTitle: { color: "#ffffff", fontSize: 18, fontWeight: "800", marginBottom: 4 },
  riskSubtitle: { color: "#94a3b8", fontSize: 13, maxWidth: width * 0.55 },
  riskPercent: { fontSize: 28, fontWeight: "900" },
  progressBg: {
    height: 10,
    borderRadius: 8,
    backgroundColor: "#0f172a",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 8 },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickButton: {
    width: "48%",
    backgroundColor: "#1a2436",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  quickIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  quickLabel: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
});