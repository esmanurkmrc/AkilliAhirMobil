import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, SafeAreaView, 
  TouchableOpacity, Dimensions, ActivityIndicator, StatusBar 
} from 'react-native';
import { LineChart, BarChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from '@expo/vector-icons';


import { API_BASE_URL } from '../config'; 

const { width } = Dimensions.get('window');

export default function SutVerileriPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isListVisible, setIsListVisible] = useState(false);

  const fetchProductionData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/productivity`);
      const rawData = await res.json();
      setData(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      console.error("Üretim verisi çekilemedi", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductionData();
  }, [fetchProductionData]);

  
  const totalSut = data.reduce((acc, curr) => acc + (curr.sutVerimi || 0), 0);
  const avgSut = data.length > 0 ? (totalSut / data.length).toFixed(1) : "0";
  const maxSut = data.length > 0 ? Math.max(...data.map(d => d.sutVerimi || 0)) : "0";
  
 
  const avgEfficiency = data.length > 0 
    ? (data.reduce((acc, curr) => {
        const ratio = curr.yemTuketimi > 0 ? (curr.sutVerimi / curr.yemTuketimi) : 0;
        return acc + ratio;
      }, 0) / data.length).toFixed(2) 
    : "0.00";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Üretim verileri analiz ediliyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🥛 Üretim Paneli</Text>
          <Text style={styles.headerSub}>Süt ve yem verimlilik analizi.</Text>
        </View>
        <TouchableOpacity 
            style={styles.toggleBtn} 
            onPress={() => setIsListVisible(!isListVisible)}
        >
          <MaterialCommunityIcons 
            name={isListVisible ? "view-dashboard-outline" : "format-list-bulleted"} 
            size={24} color="#fff" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        
        <View style={styles.kpiGrid}>
          <KPICard label="TOPLAM ÜRETİM" value={`${totalSut.toFixed(1)} L`} color="#3b82f6" />
          <KPICard label="GÜNLÜK ORT." value={`${avgSut} L`} color="#10b981" />
          <KPICard label="ZİRVE VERİM" value={`${maxSut} L`} color="#f59e0b" />
          <KPICard label="VERİM SKORU" value={avgEfficiency} color="#6366f1" />
        </View>

        {!isListVisible ? (
          <>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="chart-line" size={20} color="#3b82f6" />
                <Text style={styles.cardTitle}>Günlük Üretim Trendi (Litre)</Text>
              </View>
              {data.length > 0 ? (
                <LineChart
                  data={{
                    labels: data.slice(-6).map(d => d.tarih ? d.tarih.split('-')[2] : ''),
                    datasets: [{ data: data.slice(-6).map(d => d.sutVerimi || 0) }]
                  }}
                  width={width - 40}
                  height={200}
                  chartConfig={chartConfig("#3b82f6")}
                  bezier
                  style={styles.chart}
                />
              ) : <Text style={styles.noData}>Yeterli veri bulunamadı.</Text>}
            </View>

           
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="barley" size={20} color="#f59e0b" />
                <Text style={styles.cardTitle}>Günlük Yem Tüketimi (kg)</Text>
              </View>
              {data.length > 0 ? (
                <BarChart
                  data={{
                    labels: data.slice(-6).map(d => d.tarih ? d.tarih.split('-')[2] : ''),
                    datasets: [{ data: data.slice(-6).map(d => d.yemTuketimi || 0) }]
                  }}
                  width={width - 40}
                  height={180}
                  chartConfig={chartConfig("#f59e0b")}
                  style={styles.chart}
                  fromZero
                />
              ) : <Text style={styles.noData}>Yeterli veri bulunamadı.</Text>}
            </View>
          </>
        ) : (
          
          <View style={styles.listCard}>
            <Text style={styles.cardTitle}>📋 Detaylı Üretim Kayıtları</Text>
            {data.length > 0 ? (
              data.slice().reverse().map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View>
                    <Text style={styles.listDate}>{item.tarih || '---'}</Text>
                    <Text style={styles.listSubText}>Yem: {item.yemTuketimi} kg</Text>
                  </View>
                  <View style={styles.listValues}>
                    <Text style={styles.listSut}>{item.sutVerimi} L</Text>
                    <Text style={styles.listEfficiency}>
                      {item.yemTuketimi > 0 ? (item.sutVerimi / item.yemTuketimi).toFixed(2) : "0.00"} verim
                    </Text>
                  </View>
                </View>
              ))
            ) : <Text style={styles.noData}>Kayıtlı veri bulunmuyor.</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const KPICard = ({ label, value, color }) => (
  <View style={[styles.kpiCard, { borderLeftColor: color }]}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
  </View>
);

const chartConfig = (color) => ({
  backgroundColor: "#fff",
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 1,
  color: (opacity = 1) => color,
  labelColor: (opacity = 1) => `#64748b`,
  style: { borderRadius: 16 },
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#fff" }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 14 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: 10
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  toggleBtn: { backgroundColor: '#3b82f6', padding: 10, borderRadius: 12, elevation: 2 },
  scrollContent: { padding: 20 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  kpiCard: { 
    backgroundColor: '#fff', 
    width: (width - 55) / 2, 
    padding: 15, 
    borderRadius: 18, 
    marginBottom: 15,
    borderLeftWidth: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  kpiLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' },
  kpiValue: { fontSize: 20, fontWeight: '900', marginTop: 5 },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 24, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#475569', marginLeft: 8 },
  chart: { borderRadius: 16, marginLeft: -15 },
  noData: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20 },
  listCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 2 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  listDate: { fontSize: 14, color: '#1e293b', fontWeight: '700' },
  listSubText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  listValues: { alignItems: 'flex-end' },
  listSut: { fontSize: 16, fontWeight: '900', color: '#3b82f6' },
  listEfficiency: { fontSize: 12, color: '#10b981', fontWeight: '700', marginTop: 2 }
});