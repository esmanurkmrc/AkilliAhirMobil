import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, SafeAreaView, 
  TouchableOpacity, ActivityIndicator, Dimensions, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../config'; 

const { width } = Dimensions.get('window');

export default function AnomaliAnalizPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLogs, setActionLogs] = useState([]);
  const [stats, setStats] = useState({ kritik: 0, cozulur: 12, saglik: 94 });

  useEffect(() => {
    detectAnomalies();
  }, []);

  const detectAnomalies = async () => {
    try {
      const [prodData, envData] = await Promise.all([
  fetch(`${API_BASE_URL}/api/productivity`).then(res => res.json()),
  fetch(`${API_BASE_URL}/api/sensor-data`).then(res => res.json())
]);

const prodRes = Array.isArray(prodData) ? prodData : [];
const envRes = Array.isArray(envData) ? envData : [];

      const foundAnomalies = [];
      let kritikCount = 0;

      
      envRes.forEach(env => {
        const prod = prodRes.find(p => p.tarih === env.tarih);

        
        if (prod && prod.sutVerimi < 15) {
          kritikCount++;
          foundAnomalies.push({
            id: `verim-${prod.id}`,
            level: "KRİTİK",
            title: "Ani Verim Düşüşü",
            desc: `Süt verimi ${prod.sutVerimi}L'ye düştü. Verim kaybı riski yüksek!`,
            icon: "chart-bell-curve-cumulative",
            color: "#ef4444",
            bg: "#fef2f2",
            link: "/sut"
          });
        }

       
        if (env.sicaklik > 22) {
          foundAnomalies.push({
            id: `isi-${env.id}`,
            level: "UYARI",
            title: "Isı Stresi Riski",
            desc: `Sıcaklık ${env.sicaklik}°C. Hayvanların su tüketimi artırılmalı.`,
            icon: "thermometer-alert",
            color: "#ea580c",
            bg: "#fff7ed",
            link: "/sensor"
          });
        }

       
        if (env.amonyak > 20) {
          kritikCount++;
          foundAnomalies.push({
            id: `nh3-${env.id}`,
            level: "KRİTİK",
            title: "Hava Kalitesi Düşük",
            desc: `Amonyak: ${env.amonyak} ppm. Havalandırmayı derhal açın.`,
            icon: "wind",
            color: "#7e22ce",
            bg: "#faf5ff",
            link: "/sensor"
          });
        }
      });

      setAlerts(foundAnomalies.reverse().slice(0, 5));
      setStats(prev => ({ ...prev, kritik: kritikCount }));
    } catch (err) {
      console.error("Analiz hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (title) => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString().slice(0, 5),
      action: `${title} için müdahale edildi.`,
    };
    setActionLogs([newLog, ...actionLogs]);
    Alert.alert("Başarılı", "Müdahale protokolü başlatıldı ve geçmişe kaydedildi.");
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
       
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderBottomColor: '#ef4444' }]}>
            <Text style={styles.statLabel}>KRİTİK</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.kritik}</Text>
          </View>
          <View style={[styles.statCard, { borderBottomColor: '#22c55e' }]}>
            <Text style={styles.statLabel}>ÇÖZÜLEN</Text>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.cozulur}</Text>
          </View>
          <View style={[styles.statCard, { borderBottomColor: '#3b82f6' }]}>
            <Text style={styles.statLabel}>SAĞLIK</Text>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>%{stats.saglik}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🧠 Sistem Zekası Raporu</Text>

       
        {alerts.map((alert) => (
          <View key={alert.id} style={[styles.alertCard, { backgroundColor: alert.bg }]}>
            <View style={styles.alertHeader}>
              <MaterialCommunityIcons name={alert.icon} size={24} color={alert.color} />
              <Text style={[styles.levelLabel, { color: alert.color }]}>{alert.level}</Text>
            </View>
            <Text style={styles.cardTitle}>{alert.title}</Text>
            <Text style={styles.cardDesc}>{alert.desc}</Text>
            
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push(alert.link)}>
                <Text style={styles.secondaryBtnText}>Detay</Text>
                <MaterialCommunityIcons name="arrow-right" size={14} color="#475569" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => handleAction(alert.title)}>
                <Text style={styles.primaryBtnText}>Aksiyon Al</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>📋 Müdahale Geçmişi</Text>
          <View style={styles.logContainer}>
            {actionLogs.length > 0 ? actionLogs.map(log => (
              <View key={log.id} style={styles.logItem}>
                <Text style={styles.logTime}>{log.time}</Text>
                <Text style={styles.logText} numberOfLines={1}>{log.action}</Text>
                <Text style={styles.logStatus}>OK</Text>
              </View>
            )) : (
              <Text style={styles.emptyLog}>Henüz bir müdahale kaydı yok.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { 
    backgroundColor: '#fff', 
    width: (width - 60) / 3, 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center',
    borderBottomWidth: 4,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05
  },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, marginTop: 10 },
  alertCard: { padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  levelLabel: { fontSize: 11, fontWeight: '900', marginLeft: 8 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a' },
  cardDesc: { fontSize: 14, color: '#475569', marginTop: 5, lineHeight: 20 },
  actionRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
  primaryBtn: { backgroundColor: '#1e293b', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  secondaryBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 12, marginRight: 5 },
  logSection: { marginTop: 30 },
  logContainer: { backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  logItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logTime: { fontSize: 12, fontWeight: 'bold', color: '#64748b', width: 45 },
  logText: { flex: 1, fontSize: 13, color: '#1e293b', paddingHorizontal: 10 },
  logStatus: { fontSize: 10, fontWeight: 'bold', color: '#16a34a', backgroundColor: '#f0fdf4', padding: 4, borderRadius: 5 },
  emptyLog: { textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }
});