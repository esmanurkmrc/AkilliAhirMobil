import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { API_BASE_URL, ML_BASE_URL } from "../config";

export default function AnlikVerimAnaliz() {
  const SENSOR_API = `${API_BASE_URL}/api/sensor-data/son`;
  const SUT_API = `${API_BASE_URL}/api/sut-verim`;
  const SON_50_API = `${API_BASE_URL}/api/sut-verim`;
  const ML_API = `${ML_BASE_URL}/predict`;
  const TRAIN_API = `${ML_BASE_URL}/train-live`;
  const MODEL_STATUS_API = `${ML_BASE_URL}/model-status`;

  const [sensor, setSensor] = useState(null);
  const [tahmin, setTahmin] = useState(null);
  const [kayitlar, setKayitlar] = useState([]);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [kayitLoading, setKayitLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [listeAcik, setListeAcik] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [sonGuncelleme, setSonGuncelleme] = useState("-");

  const [form, setForm] = useState({
    kupeNo: "",
    sutVerimi: "",
    yemTuketimi: "",
    tarih: new Date().toISOString().split("T")[0],
  });

  const fetchSensor = async () => {
    try {
      const res = await fetch(SENSOR_API);
      if (res.ok) {
        const data = await res.json();
        setSensor(data);
        setSonGuncelleme(new Date().toLocaleTimeString("tr-TR"));
      }
    } catch (error) {
      console.log("Sensör verisi alınamadı:", error);
    }
  };

  const fetchSon50 = async () => {
    try {
      const res = await fetch(SON_50_API);
      if (res.ok) {
        const data = await res.json();
        const liste = Array.isArray(data) ? data : [];
        const siraliListe = liste
          .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
          .slice(0, 50);

        setKayitlar(siraliListe);
      }
    } catch (error) {
      console.log("Süt kayıtları alınamadı:", error);
    }
  };

  const fetchModelStatus = async () => {
    try {
      const res = await fetch(MODEL_STATUS_API);
      if (res.ok) {
        const data = await res.json();
        setModelStatus(data);
      }
    } catch (error) {
      console.log("Model durumu alınamadı:", error);
    }
  };

  const tahminYap = async () => {
    if (!sensor) return;

    setLoading(true);

    const payload = {
      sicaklik: Number(sensor.sicaklik || 0),
      nem: Number(sensor.nem || 0),
      amonyak: Number(sensor.amonyak || 0),
      isik: Number(sensor.isik || 0),
      yem_tuketimi: Number(form.yemTuketimi || 6),
    };

    try {
      const res = await fetch(ML_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setTahmin(data);
      }
    } catch (error) {
      console.log("ML tahmin hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const modeliGuncelle = async () => {
    setTrainLoading(true);
    setMesaj("");

    try {
      const res = await fetch(TRAIN_API, { method: "POST" });

      if (res.ok) {
        const data = await res.json();
        setModelStatus(data);

        if (data.durum === "Model güncellendi") {
          setMesaj("Model son kayıtlarla güncellendi.");
          tahminYap();
        } else {
          setMesaj(data.mesaj || "Model işlemi tamamlandı.");
        }

        fetchModelStatus();
      } else {
        setMesaj("Model güncellenemedi.");
      }
    } catch (error) {
      console.log("Model güncelleme hatası:", error);
      setMesaj("FastAPI bağlantısı kurulamadı.");
    } finally {
      setTrainLoading(false);
    }
  };

  const kayitEkle = async () => {
    if (!form.kupeNo || !form.sutVerimi || !form.yemTuketimi || !form.tarih) {
      setMesaj("Lütfen tüm alanları doldur.");
      return;
    }

    setKayitLoading(true);
    setMesaj("");

    const payload = {
      kupeNo: form.kupeNo,
      sutVerimi: Number(form.sutVerimi),
      yemTuketimi: Number(form.yemTuketimi),
      tarih: form.tarih,
    };

    try {
      const res = await fetch(SUT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMesaj("Süt verimi kaydedildi.");
        setForm({
          kupeNo: "",
          sutVerimi: "",
          yemTuketimi: "",
          tarih: new Date().toISOString().split("T")[0],
        });
        fetchSon50();
        setListeAcik(true);
      } else {
        setMesaj("Kayıt eklenemedi.");
      }
    } catch (error) {
      console.log("Kayıt hatası:", error);
      setMesaj("Backend bağlantı hatası.");
    } finally {
      setKayitLoading(false);
    }
  };

  useEffect(() => {
    fetchSensor();
    fetchSon50();
    fetchModelStatus();

    const interval = setInterval(() => {
      fetchSensor();
      fetchSon50();
      fetchModelStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sensor) tahminYap();
  }, [sensor]);

  const setField = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const thi = sensor
    ? 1.8 * Number(sensor.sicaklik || 0) +
      32 -
      (0.55 - 0.0055 * Number(sensor.nem || 0)) *
        (1.8 * Number(sensor.sicaklik || 0) - 26)
    : 0;

  const tahminiSut = tahmin
    ? Number(tahmin.tahmin_edilen_sut || tahmin.tahmin || 0).toFixed(1)
    : "--";

  const durum = tahmin ? tahmin.durum || "Analiz tamamlandı" : "Veri bekleniyor";

  const riskliMi =
    durum.toLowerCase().includes("risk") ||
    durum.toLowerCase().includes("düşük") ||
    thi >= 72 ||
    Number(sensor?.amonyak || 0) > 25;

  const getVerimYorumu = () => {
    if (!sensor) return "Anlık sensör verisi bekleniyor.";

    const sicaklik = Number(sensor.sicaklik || 0);
    const nem = Number(sensor.nem || 0);
    const amonyak = Number(sensor.amonyak || 0);
    const yem = Number(form.yemTuketimi || 6);

    if (sicaklik >= 30 && nem >= 70 && amonyak > 25) {
      return "Yüksek sıcaklık, yüksek nem ve amonyak artışı nedeniyle süt veriminde düşüş beklenmektedir.";
    }

    if (sicaklik >= 30 && nem >= 70) {
      return "Sıcaklık ve nem yükseldiği için ısı stresi riski oluşabilir.";
    }

    if (amonyak > 25) {
      return "Amonyak seviyesi kritik sınırın üzerindedir. Süt veriminde azalma beklenebilir.";
    }

    if (thi >= 72) {
      return "THI değeri ısı stresi sınırına yakındır. Düşüş eğilimi oluşabilir.";
    }

    if (yem < 5) {
      return "Yem tüketimi düşük olduğu için model düşüş bekleyebilir.";
    }

    return "Anlık değerler kabul edilebilir seviyededir. Süt veriminin normal seyretmesi beklenmektedir.";
  };

  const getSaglikYorumu = () => {
    if (!sensor) {
      return {
        risk: "Veri Bekleniyor",
        mesaj: "Sensör verisi alındığında sağlık ve konfor yorumu oluşturulacaktır.",
        oneriler: ["Sensör bağlantısını kontrol et"],
      };
    }

    const sicaklik = Number(sensor.sicaklik || 0);
    const nem = Number(sensor.nem || 0);
    const amonyak = Number(sensor.amonyak || 0);
    const isik = Number(sensor.isik || 0);

    if (amonyak > 25 && sicaklik >= 30 && nem >= 70) {
      return {
        risk: "Yüksek Risk",
        mesaj:
          "Amonyak, sıcaklık ve nem birlikte yüksek. Solunum problemi ve ısı stresi riski oluşabilir.",
        oneriler: ["Havalandırmayı aç", "Fan sistemini çalıştır", "Ahır temizliğini kontrol et"],
      };
    }

    if (amonyak > 25) {
      return {
        risk: "Orta Risk",
        mesaj:
          "Amonyak seviyesi kritik sınırın üzerindedir. Hayvan konforu olumsuz etkilenebilir.",
        oneriler: ["Havalandırmayı artır", "Gübre temizliğini kontrol et"],
      };
    }

    if (sicaklik >= 30 && nem >= 70) {
      return {
        risk: "Orta Risk",
        mesaj: "Sıcaklık ve nem birlikte yükselmiştir. Isı stresi riski oluşabilir.",
        oneriler: ["Fanları çalıştır", "Su erişimini kontrol et"],
      };
    }

    if (thi >= 72) {
      return {
        risk: "Dikkat",
        mesaj: "THI değeri risk sınırına yaklaşmıştır. Hayvan konforu izlenmelidir.",
        oneriler: ["Ortam sıcaklığını takip et", "Serinletme önlemlerini hazırla"],
      };
    }

    if (isik < 50) {
      return {
        risk: "Düşük Risk",
        mesaj: "Işık seviyesi düşüktür. Aydınlatma kontrol edilmelidir.",
        oneriler: ["Aydınlatmayı kontrol et"],
      };
    }

    return {
      risk: "Risk Yok",
      mesaj: "Sensör değerleri normal aralıklardadır. Hayvan konforu uygun görünmektedir.",
      oneriler: ["Sistemi izlemeye devam et"],
    };
  };

  const grafikVerileri = kayitlar.slice(0, 10).reverse();
  const verimYorumu = getVerimYorumu();
  const saglikYorumu = getSaglikYorumu();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Canlı ML Analizi</Text>
          </View>

          <Text style={styles.title}>Anlık Verim Analizi</Text>
          <Text style={styles.subtitle}>
            Canlı sensör verisi, süt verimi tahmini ve sağlık-konfor yorumu.
          </Text>

          <View style={[styles.predictionCard, riskliMi ? styles.riskCard : styles.safeCard]}>
            <View>
              <Text style={styles.predictionLabel}>Tahmini Süt Verimi</Text>
              <Text style={styles.predictionStatus}>{durum}</Text>
            </View>

            <Text style={styles.predictionValue}>{tahminiSut} L</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard title="Sıcaklık" value={`${sensor ? Number(sensor.sicaklik || 0).toFixed(1) : "0.0"}°C`} icon="thermometer" color="#ef4444" />
          <MetricCard title="Nem" value={`%${sensor ? Number(sensor.nem || 0).toFixed(1) : "0.0"}`} icon="water-percent" color="#2563eb" />
          <MetricCard title="Amonyak" value={`${sensor ? Number(sensor.amonyak || 0).toFixed(1) : "0.0"} ppm`} icon="weather-windy" color="#f97316" />
          <MetricCard title="THI" value={thi.toFixed(1)} icon="chart-bell-curve" color="#7c3aed" />
        </View>

        <View style={styles.cardHighlight}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Makine Öğrenmesi Analizi</Text>
              <Text style={styles.cardSub}>{verimYorumu}</Text>
            </View>
            <MaterialCommunityIcons name="brain" size={28} color="#7c3aed" />
          </View>

          <View style={styles.statusGrid}>
            <StatusBox title="Model" value={loading ? "Çalışıyor" : modelStatus?.durum || "Hazır"} />
            <StatusBox title="Son Veri" value={`${kayitlar.length}/50`} />
            <StatusBox title="R²" value={modelStatus?.r2_skoru !== null && modelStatus?.r2_skoru !== undefined ? String(modelStatus.r2_skoru) : "-"} />
            <StatusBox title="Saat" value={sonGuncelleme} />
          </View>

          <View style={styles.buttonGrid}>
            <TouchableOpacity style={styles.secondaryButton} onPress={tahminYap} disabled={loading || !sensor}>
              <Text style={styles.secondaryButtonText}>{loading ? "Analiz..." : "Tekrar Analiz Et"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.purpleButton} onPress={modeliGuncelle} disabled={trainLoading || kayitlar.length < 5}>
              <Text style={styles.purpleButtonText}>{trainLoading ? "Güncelleniyor..." : "Modeli Güncelle"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.greenButton} onPress={() => setListeAcik(!listeAcik)}>
            <Text style={styles.greenButtonText}>
              {listeAcik ? "Kayıtları Gizle" : "Süt Verimi Kayıtlarını Listele"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Sağlık ve Konfor Yorumu</Text>
              <Text style={styles.cardSub}>{saglikYorumu.risk}</Text>
            </View>
            <MaterialCommunityIcons name="shield-heart-outline" size={28} color="#16a34a" />
          </View>

          <Text style={styles.healthText}>{saglikYorumu.mesaj}</Text>

          <View style={styles.actionWrap}>
            {saglikYorumu.oneriler.map((item, index) => (
              <Text key={index} style={styles.actionPill}>{item}</Text>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Süt Verimi Kaydı</Text>
              <Text style={styles.cardSub}>Gerçek günlük süt ve yem verimini gir.</Text>
            </View>
            <Text style={styles.pill}>Manuel</Text>
          </View>

          <View style={styles.formGrid}>
            <Input label="Küpe No" value={form.kupeNo} onChangeText={(v) => setField("kupeNo", v)} placeholder="101" />
            <Input label="Süt Verimi (L)" value={form.sutVerimi} onChangeText={(v) => setField("sutVerimi", v)} placeholder="4.5" keyboardType="decimal-pad" />
            <Input label="Yem (kg)" value={form.yemTuketimi} onChangeText={(v) => setField("yemTuketimi", v)} placeholder="4.2" keyboardType="decimal-pad" />
            <Input label="Tarih" value={form.tarih} onChangeText={(v) => setField("tarih", v)} placeholder="2026-05-31" />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={kayitEkle} disabled={kayitLoading}>
            {kayitLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Süt Verimini Kaydet</Text>}
          </TouchableOpacity>

          {mesaj ? <Text style={styles.message}>{mesaj}</Text> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Son 10 Süt Verimi</Text>
              <Text style={styles.cardSub}>Kayıtlara göre mini trend görünümü.</Text>
            </View>
            <MaterialCommunityIcons name="chart-bar" size={28} color="#2563eb" />
          </View>

          <View style={styles.barChart}>
            {grafikVerileri.length === 0 ? (
              <Text style={styles.emptyText}>Grafik için kayıt bekleniyor.</Text>
            ) : (
              grafikVerileri.map((item, index) => {
                const value = Number(item.sutVerimi || 0);
                const height = Math.max(20, Math.min(120, value * 24));

                return (
                  <View key={index} style={styles.barItem}>
                    <View style={[styles.bar, { height }]} />
                    <Text style={styles.barLabel}>{value.toFixed(1)}</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {listeAcik && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.cardTitle}>Süt Verimi Kayıtları</Text>
                <Text style={styles.cardSub}>Son kayıtlar model güncelleme için kullanılır.</Text>
              </View>
            </View>

            {kayitlar.length === 0 ? (
              <Text style={styles.emptyText}>Henüz kayıt bulunamadı.</Text>
            ) : (
              kayitlar.map((item) => (
                <View key={item.id} style={styles.recordRow}>
                  <View>
                    <Text style={styles.recordTitle}>Küpe No: {item.kupeNo}</Text>
                    <Text style={styles.recordSub}>ID: {item.id} • {item.tarih}</Text>
                  </View>
                  <View style={styles.recordRight}>
                    <Text style={styles.recordValue}>{Number(item.sutVerimi || 0).toFixed(1)} L</Text>
                    <Text style={styles.recordSub}>{Number(item.yemTuketimi || 0).toFixed(1)} kg yem</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ title, value, icon, color }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={23} color={color} />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Input({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.inputBox}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType || "default"}
        style={styles.input}
      />
    </View>
  );
}

function StatusBox({ title, value }) {
  return (
    <View style={styles.statusBox}>
      <Text style={styles.statusTitle}>{title}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#eef5ff",
  },
  page: {
    flex: 1,
    padding: 16,
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  liveBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#eaf3ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 12,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 10,
    backgroundColor: "#22c55e",
  },
  liveBadgeText: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
  },
  predictionCard: {
    marginTop: 18,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  safeCard: {
    backgroundColor: "#16a34a",
  },
  riskCard: {
    backgroundColor: "#dc2626",
  },
  predictionLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "800",
  },
  predictionValue: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
  },
  predictionStatus: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metricIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  metricTitle: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
  },
  metricValue: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  cardHighlight: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#c4b5fd",
    marginBottom: 16,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
  },
  cardSub: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  pill: {
    color: "#15803d",
    backgroundColor: "#dcfce7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "900",
    alignSelf: "flex-start",
  },
  formGrid: {
    gap: 12,
  },
  inputBox: {
    gap: 7,
  },
  inputLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  input: {
    height: 48,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe4f0",
    borderRadius: 15,
    paddingHorizontal: 14,
    color: "#0f172a",
    fontSize: 14,
  },
  primaryButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  message: {
    marginTop: 12,
    color: "#15803d",
    backgroundColor: "#dcfce7",
    padding: 12,
    borderRadius: 14,
    fontWeight: "800",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  statusBox: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
  },
  statusTitle: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "900",
  },
  statusValue: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 6,
  },
  buttonGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#eaf3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontWeight: "900",
  },
  purpleButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  purpleButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  greenButton: {
    height: 46,
    borderRadius: 15,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  greenButtonText: {
    color: "#15803d",
    fontWeight: "900",
  },
  healthText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 14,
  },
  actionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionPill: {
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: "800",
  },
  barChart: {
    height: 170,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    padding: 14,
  },
  barItem: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  bar: {
    width: 16,
    borderRadius: 999,
    backgroundColor: "#2563eb",
  },
  barLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
  },
  emptyText: {
    color: "#64748b",
    fontWeight: "800",
    textAlign: "center",
  },
  recordRow: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  recordTitle: {
    color: "#0f172a",
    fontWeight: "900",
  },
  recordSub: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  recordRight: {
    alignItems: "flex-end",
  },
  recordValue: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "900",
  },
});