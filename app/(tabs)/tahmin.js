import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';


import { API_BASE_URL } from '../config'; 

const { width } = Dimensions.get('window');


const FAST_API_URL = 'http://192.168.137.1:8000/predict'; 

export default function TahminEkrani() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [environmentData, setEnvironmentData] = useState(null);
  const [thi, setThi] = useState(0);
  const [systemScore, setSystemScore] = useState(0);
  const [todayMilk, setTodayMilk] = useState(0);
  const [yesterdayMilk, setYesterdayMilk] = useState(0);
  const [difference, setDifference] = useState(0);
  const [percentChange, setPercentChange] = useState(0);
  const [milkScore, setMilkScore] = useState(0);
  const [latestDate, setLatestDate] = useState('');
  const [previousDate, setPreviousDate] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');

 
  const calculateThi = (t, rh) => (1.8 * t + 32) - (0.55 - 0.0055 * rh) * (1.8 * t - 26);

  const calculateSystemScore = (t, rh, ammonia, thiValue) => {
    let score = 100;
    if (t < 18 || t > 32) score -= 20;
    if (rh < 40 || rh > 85) score -= 20;
    if (ammonia > 25) score -= 30;
    if (thiValue >= 79) score -= 25;
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const calculateMilkScore = (today, yesterday) => {
    if (yesterday === 0) return today > 0 ? 85 : 0;
    const changePercent = ((today - yesterday) / yesterday) * 100;
    if (changePercent >= 5) return 95;
    if (changePercent >= 0) return 85;
    if (changePercent >= -10) return 60;
    return 30;
  };

  const getMilkScoreText = (score) => {
    if (score >= 85) return 'Mükemmel';
    if (score >= 60) return 'Dengeli';
    return 'Düşük';
  };

  const getMilkScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const fetchData = useCallback(async () => {
    try {
      const [envRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/environment/latest`),
        fetch(`${API_BASE_URL}/api/productivity`)
      ]);

      const envJson = envRes.ok ? await envRes.ok && envRes.json() : null;
      const prodJson = prodRes.ok ? await prodRes.json() : [];

      if (envJson) {
        setEnvironmentData(envJson);
        const t = Number(envJson.sicaklik || 0);
        const rh = Number(envJson.nem || 0);
        const nh3 = Number(envJson.amonyak || 0);
        
        const thiVal = calculateThi(t, rh);
        setThi(thiVal);
        setSystemScore(calculateSystemScore(t, rh, nh3, thiVal));

        
        try {
          const aiRes = await fetch(FAST_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sicaklik: t, nem: rh, amonyak: nh3 }),
          });
          if (aiRes.ok) setAiResult(await aiRes.json());
        } catch (e) { console.log("AI Servisi Çevrimdışı"); }
      }

     
      if (prodJson.length > 0) {
        const uniqueDates = [...new Set(prodJson.map(d => d.tarih))].sort((a, b) => new Date(b) - new Date(a));
        const latest = uniqueDates[0], prev = uniqueDates[1];
        setLatestDate(latest); setPreviousDate(prev);

        const sumMilk = (date) => prodJson.filter(d => d.tarih === date).reduce((s, i) => s + (i.sutVerimi || 0), 0);
        const today = sumMilk(latest), yesterday = sumMilk(prev);

        setTodayMilk(today); setYesterdayMilk(yesterday);
        setDifference(today - yesterday);
        setPercentChange(yesterday === 0 ? 0 : ((today - yesterday) / yesterday) * 100);
        setMilkScore(calculateMilkScore(today, yesterday));
      }

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Tahmin verisi çekilemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#22c55e" />
      <Text style={styles.loadingText}>Analiz raporu oluşturuluyor...</Text>
    </View>
  );

  const thiStatus = thi < 72 ? { text: 'Konforlu', color: '#10b981', icon: 'check-circle' } : 
                    thi < 79 ? { text: 'Riskli', color: '#f59e0b', icon: 'alert-circle' } : 
                    { text: 'Kritik', color: '#ef4444', icon: 'alert-octagon' };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>AKILLI AHIR PANELİ</Text>
            <Text style={styles.mainTitle}>Tahmin & Analiz</Text>
          </View>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="#22c55e" />
            <Text style={styles.badgeText}>AI Aktif</Text>
          </View>
        </View>

        
        <View style={[styles.heroCard, aiResult?.durum === 'Düşük Verim Riski' ? styles.heroWarning : styles.heroSuccess]}>
          <MaterialCommunityIcons name="robot" size={82} color="rgba(255,255,255,0.15)" style={styles.heroIcon} />
          <Text style={styles.heroLabel}>YAPAY ZEKA TAHMİNİ</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroValue}>{aiResult?.tahmin_edilen_sut?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.heroUnit}>L / Gün</Text>
          </View>
          <Text style={styles.heroSub}>Beklenen Durum: {aiResult?.durum || 'Normal'}</Text>
        </View>

        <View style={styles.dualRow}>
          <ScoreCard title="Sistem Skoru" value={systemScore} sub="/100" icon="shield-check" color="#16a34a" bg="#dcfce7" />
          <ScoreCard title="Verim Skoru" value={milkScore} sub={getMilkScoreText(milkScore)} icon="chart-line" color={getMilkScoreColor(milkScore)} bg="#f1f5f9" />
        </View>

        
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="database" size={22} color="#2563eb" />
            <Text style={styles.sectionTitle}>Üretim Karşılaştırma</Text>
          </View>
          <View style={styles.compareRow}>
            <View style={styles.compareBox}><Text style={styles.compareLabel}>Önceki Gün</Text><Text style={styles.compareValue}>{yesterdayMilk.toFixed(1)}L</Text></View>
            <View style={styles.compareCenter}>
              <MaterialCommunityIcons name={difference >= 0 ? 'arrow-up-bold' : 'arrow-down-bold'} size={24} color={difference >= 0 ? '#22c55e' : '#ef4444'} />
              <Text style={[styles.compareDiff, { color: difference >= 0 ? '#22c55e' : '#ef4444' }]}>{difference >= 0 ? '+' : ''}{difference.toFixed(1)}L</Text>
            </View>
            <View style={styles.compareBox}><Text style={styles.compareLabel}>Son Gün</Text><Text style={styles.compareValue}>{todayMilk.toFixed(1)}L</Text></View>
          </View>
        </View>

        
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="heart-pulse" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>THI (Sıcaklık Nem İndeksi)</Text>
          </View>
          <View style={styles.thiTopRow}>
            <Text style={styles.thiBig}>{thi.toFixed(1)}</Text>
            <View style={[styles.thiBadge, { borderColor: thiStatus.color, backgroundColor: `${thiStatus.color}11` }]}>
              <MaterialCommunityIcons name={thiStatus.icon} size={18} color={thiStatus.color} />
              <Text style={[styles.thiBadgeText, { color: thiStatus.color }]}>{thiStatus.text}</Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min((thi / 90) * 100, 100)}%`, backgroundColor: thiStatus.color }]} />
          </View>
        </View>

        <Text style={styles.footer}>Son Güncelleme: {lastUpdate}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}


const ScoreCard = ({ title, value, sub, icon, color, bg }) => (
  <View style={styles.smallScoreCard}>
    <View style={styles.cardHeader}>
      <View style={[styles.iconCircle, { backgroundColor: bg }]}><MaterialCommunityIcons name={icon} size={22} color={color} /></View>
      <Text style={styles.sectionTitleSmall}>{title}</Text>
    </View>
    <Text style={[styles.smallScoreValue, { color: color === '#16a34a' ? '#fff' : color }]}>{value}</Text>
    <Text style={styles.smallScoreSub}>{sub}</Text>
  </View>
);



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scroll: { padding: 18, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' },
  loadingText: { color: '#cbd5e1', marginTop: 14, fontSize: 15, fontWeight: '600' },
  header: { marginTop: 8, marginBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: '#22c55e', fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  mainTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: '#1e293b' },
  badgeText: { color: '#e2e8f0', marginLeft: 6, fontWeight: '700', fontSize: 12 },
  heroCard: { borderRadius: 28, padding: 24, minHeight: 175, justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
  heroSuccess: { backgroundColor: '#0ea5e9' },
  heroWarning: { backgroundColor: '#f59e0b' },
  heroIcon: { position: 'absolute', right: -10, bottom: -10 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '800' },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  heroValue: { color: '#fff', fontSize: 52, fontWeight: '900' },
  heroUnit: { color: '#fff', fontSize: 18, marginLeft: 8, marginBottom: 8 },
  heroSub: { color: '#fff', marginTop: 8, fontSize: 14, fontWeight: '600' },
  dualRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  smallScoreCard: { flex: 1, backgroundColor: '#0f172a', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#1e293b' },
  sectionTitleSmall: { color: '#fff', fontSize: 13, fontWeight: '800', marginLeft: 8 },
  smallScoreValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 10 },
  smallScoreSub: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  sectionCard: { backgroundColor: '#0f172a', borderRadius: 24, padding: 20, marginBottom: 18, borderWidth: 1, borderColor: '#1e293b' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 12 },
  compareRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  compareBox: { backgroundColor: '#1e293b', padding: 12, borderRadius: 15, alignItems: 'center', width: '30%' },
  compareLabel: { color: '#94a3b8', fontSize: 11 },
  compareValue: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 5 },
  compareCenter: { alignItems: 'center', width: '30%' },
  compareDiff: { fontSize: 16, fontWeight: '900' },
  thiTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  thiBig: { color: '#fff', fontSize: 36, fontWeight: '900' },
  thiBadge: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 12, borderWidth: 1 },
  thiBadgeText: { marginLeft: 5, fontWeight: '800', fontSize: 12 },
  progressBg: { height: 10, backgroundColor: '#1e293b', borderRadius: 5, marginTop: 15, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  footer: { textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 10 }
});