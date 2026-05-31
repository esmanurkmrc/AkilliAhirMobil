import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Dimensions, SafeAreaView, ActivityIndicator, StatusBar 
} from 'react-native';
import { LineChart, BarChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from '@expo/vector-icons';


import { API_BASE_URL } from '../config'; 

const { width } = Dimensions.get('window');

export default function SensorVerileriPage() {
  const [data, setData] = useState([]);
  const [viewType, setViewType] = useState("daily");
  const [loading, setLoading] = useState(true);

  const fetchSensorData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analysis-environment`);
      if (!res.ok) throw new Error("Sunucu yanıt vermedi");
      
      const rawData = await res.json();
      if (!rawData || rawData.length === 0) {
        setData([]);
        return;
      }

      if (viewType === "weekly") {
        const weeklyGrouped = [];
        
        for (let i = 0; i < rawData.length; i += 7) {
          const chunk = rawData.slice(i, i + 7);
          const avgSicaklik = chunk.reduce((sum, item) => sum + (item.sicaklik || 0), 0) / chunk.length;
          const avgNem = chunk.reduce((sum, item) => sum + (item.nem || 0), 0) / chunk.length;
          const avgAmonyak = chunk.reduce((sum, item) => sum + (item.amonyak || 0), 0) / chunk.length;
          
         
          const dateStr = chunk[0].tarih ? chunk[0].tarih.split('-').reverse().slice(0, 2).join('/') : "---";
          
          weeklyGrouped.push({
            tarih: dateStr,
            sicaklik: parseFloat(avgSicaklik.toFixed(1)),
            nem: parseFloat(avgNem.toFixed(1)),
            amonyak: parseFloat(avgAmonyak.toFixed(1))
          });
        }
        setData(weeklyGrouped.slice(-6)); 
      } else {
        setData(rawData.slice(-7)); 
      }
    } catch (err) {
      console.error("Sensör Veri Hatası:", err);
    } finally {
      setLoading(false);
    }
  }, [viewType]);

  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  const chartConfig = (baseColor) => ({
    backgroundColor: "#fff",
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 1,
    color: (opacity = 1) => baseColor(opacity),
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#fff" },
    style: { borderRadius: 16 }
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Sensör verileri analiz ediliyor...</Text>
      </View>
    );
  }

  
  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="database-off" size={60} color="#cbd5e1" />
        <Text style={styles.loadingText}>Gösterilecek veri bulunamadı.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchSensorData}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>🌐 Mikroklima Analiz</Text>
          <Text style={styles.headerSubText}>Kritik eşik ve trend analizi.</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, viewType === 'daily' && styles.tabBtnActive]}
            onPress={() => setViewType("daily")}
          >
            <Text style={[styles.tabText, viewType === 'daily' && styles.tabTextActive]}>Günlük</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, viewType === 'weekly' && styles.tabBtnActive]}
            onPress={() => setViewType("weekly")}
          >
            <Text style={[styles.tabText, viewType === 'weekly' && styles.tabTextActive]}>Haftalık</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🔥 Amonyak (NH3) Analizi</Text>
            <View style={styles.limitBadge}><Text style={styles.limitText}>LİMİT: 25 ppm</Text></View>
          </View>
          <LineChart
            data={{
              labels: data.map(d => viewType === "weekly" ? d.tarih : ""),
              datasets: [{ data: data.map(d => d.amonyak || 0) }]
            }}
            width={width - 50}
            height={180}
            chartConfig={chartConfig((opacity) => `rgba(239, 68, 68, ${opacity})`)}
            bezier
            style={styles.chart}
          />
        </View>

        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌡️ Sıcaklık Trendi (°C)</Text>
          <LineChart
            data={{
              labels: data.map(d => viewType === "weekly" ? d.tarih : ""),
              datasets: [{ data: data.map(d => d.sicaklik || 0) }]
            }}
            width={width - 50}
            height={180}
            chartConfig={chartConfig((opacity) => `rgba(214, 48, 49, ${opacity})`)}
            bezier
            style={styles.chart}
          />
        </View>

       
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💧 Nem Seviyesi (%)</Text>
          <BarChart
            data={{
              labels: data.map(d => viewType === "weekly" ? d.tarih : ""),
              datasets: [{ data: data.map(d => d.nem || 0) }]
            }}
            width={width - 50}
            height={180}
            chartConfig={chartConfig((opacity) => `rgba(9, 132, 227, ${opacity})`)}
            style={styles.chart}
            fromZero
          />
        </View>

        
        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={20} color="#2980b9" />
            <Text style={styles.noteTitle}> Teknik Analiz Notu</Text>
          </View>
          <Text style={styles.noteText}>
            {viewType === "daily" 
              ? "Anlık verilerde kritik amonyak eşiği 25 ppm'dir. Bu değerin üzeri havalandırma hatasıdır." 
              : "Haftalık ortalamalar sistemin genel kararlılığını gösterir. Ani sapmaları veterinere bildirin."}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 15, padding: 10, backgroundColor: '#3498db', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  header: { 
    backgroundColor: '#fff', 
    padding: 20, 
    paddingTop: StatusBar.currentHeight || 10,
    borderBottomLeftRadius: 25, 
    borderBottomRightRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  headerSubText: { fontSize: 13, color: '#64748b', marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 5, borderRadius: 12, marginTop: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#fff', elevation: 2 },
  tabText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: '#2ecc71' },
  scrollContent: { padding: 20 },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 20, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  limitBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#fee2e2' },
  limitText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },
  chart: { marginVertical: 8, borderRadius: 16, marginLeft: -10 },
  noteCard: { 
    backgroundColor: '#e8f4fd', 
    padding: 20, 
    borderRadius: 20, 
    borderLeftWidth: 5, 
    borderLeftColor: '#3498db',
    marginBottom: 30
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  noteTitle: { color: '#2980b9', fontWeight: 'bold', fontSize: 14 },
  noteText: { color: '#34495e', fontSize: 13, lineHeight: 20 }
});