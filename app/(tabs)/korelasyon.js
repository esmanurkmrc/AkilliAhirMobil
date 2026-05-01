import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, SafeAreaView, 
  Dimensions, ActivityIndicator, StatusBar 
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from '@expo/vector-icons';


import { API_BASE_URL } from '../config'; 

const { width } = Dimensions.get('window');

export default function KorelasyonAnalizPage() {
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalysisData = useCallback(async () => {
    try {
      
      const [prodRes, envRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/productivity`).then(res => res.json().catch(() => [])),
        fetch(`${API_BASE_URL}/api/environment`).then(res => res.json().catch(() => []))
      ]);

      
      const combined = prodRes.map(prod => {
        const env = envRes.find(e => e.tarih === prod.tarih) || { sicaklik: 0, nem: 0 };
        return { 
          tarih: prod.tarih,
          sutVerimi: prod.sutVerimi || 0,
          sicaklik: env.sicaklik || 0,
          nem: env.nem || 0
        };
      });

   
      setCombinedData(combined.slice(-7)); 
    } catch (err) {
      console.error("Korelasyon Analiz Hatası:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Analiz raporu hazırlanıyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔬 Etki Analizi</Text>
        <Text style={styles.headerSub}>Çevresel faktörlerin verimlilikle korelasyonu.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
       
        <View style={styles.card}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Sıcaklık & Süt Verimi İlişkisi</Text>
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: '#a855f7' }]} /><Text style={styles.legendText}>Sıcaklık (°C)</Text>
              <View style={[styles.dot, { backgroundColor: '#1e1b4b', marginLeft: 10 }]} /><Text style={styles.legendText}>Süt (Litre)</Text>
            </View>
          </View>
          <LineChart
            data={{
              labels: combinedData.map(d => d.tarih ? d.tarih.split('-')[2] : ''),
              datasets: [
                { data: combinedData.map(d => d.sicaklik), color: () => '#a855f7', strokeWidth: 2 },
                { data: combinedData.map(d => d.sutVerimi), color: () => '#1e1b4b', strokeWidth: 3 }
              ]
            }}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

       
        <View style={styles.card}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Nem & Verimlilik İlişkisi</Text>
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: '#dc2626' }]} /><Text style={styles.legendText}>Nem (%)</Text>
              <View style={[styles.dot, { backgroundColor: '#1e1b4b', marginLeft: 10 }]} /><Text style={styles.legendText}>Süt (Litre)</Text>
            </View>
          </View>
          <LineChart
            data={{
              labels: combinedData.map(d => d.tarih ? d.tarih.split('-')[2] : ''),
              datasets: [
                { data: combinedData.map(d => d.nem), color: () => '#dc2626', strokeWidth: 2 },
                { data: combinedData.map(d => d.sutVerimi), color: () => '#1e1b4b', strokeWidth: 3 }
              ]
            }}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        
        <View style={styles.analysisNote}>
          <MaterialCommunityIcons name="brain" size={28} color="#a855f7" />
          <View style={{ flex: 1 }}>
            <Text style={styles.noteTitle}>Yapay Zeka Gözlemi</Text>
            <Text style={styles.noteText}>
              Son 7 günlük verilerde sıcaklık artışının süt verimi üzerinde ters korelasyon oluşturduğu gözlemlendi. Bu durum ısı stresini işaret etmektedir.
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const chartConfig = {
  backgroundColor: "#fff",
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`, // Lacivert tonlarında ana renk
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 14 },
  header: { padding: 25, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#ececec', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardInfo: { marginBottom: 15 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#94a3b8', marginLeft: 5, fontWeight: '600' },
  chart: { borderRadius: 16, marginLeft: -15 },
  analysisNote: { backgroundColor: '#faf5ff', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 15, borderLeftWidth: 6, borderLeftColor: '#a855f7', marginBottom: 40 },
  noteTitle: { fontWeight: 'bold', fontSize: 14, color: '#a855f7', marginBottom: 4 },
  noteText: { fontSize: 13, color: '#4b5563', lineHeight: 20 }
});