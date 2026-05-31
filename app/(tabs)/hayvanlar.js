import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config";

export default function Hayvanlar() {
  const [hayvanlar, setHayvanlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const emptyForm = {
    kupeNo: "",
    ad: "",
    cins: "",
    yas: "",
    agirlik: "",
    tur: "inek",
  };

  const emptyVerim = {
    tarih: today,
    saat: nowTime,
    yemTuketimi: "",
    sutVerimi: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [verimForm, setVerimForm] = useState(emptyVerim);
  const [editId, setEditId] = useState(null);

  const fetchHayvanlar = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/hayvanlar`);
      if (!res.ok) throw new Error("Liste çekilemedi");

      const data = await res.json();
      setHayvanlar(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Hayvanlar alınamadı:", error);
      Alert.alert("Hata", "Hayvan listesi güncellenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHayvanlar();
  }, [fetchHayvanlar]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleVerimChange = (key, value) => {
    setVerimForm((prev) => ({ ...prev, [key]: value }));
  };

  const temizleForm = () => {
    setForm(emptyForm);
    setVerimForm({
      tarih: new Date().toISOString().split("T")[0],
      saat: new Date().toTimeString().slice(0, 5),
      yemTuketimi: "",
      sutVerimi: "",
    });
    setEditId(null);
  };

  const validateForm = () => {
    if (!form.kupeNo.trim()) {
      Alert.alert("Uyarı", "Küpe numarası giriniz.");
      return false;
    }

    if (!form.ad.trim()) {
      Alert.alert("Uyarı", "Hayvan adı giriniz.");
      return false;
    }

    if (!form.cins.trim()) {
      Alert.alert("Uyarı", "Cins bilgisi giriniz.");
      return false;
    }

    return true;
  };

  const verimKaydiVarMi = () => {
    return verimForm.yemTuketimi !== "" || verimForm.sutVerimi !== "";
  };

  const verimKaydiGecerliMi = () => {
    if (!verimKaydiVarMi()) return true;

    if (!verimForm.tarih || !verimForm.saat) {
      Alert.alert("Uyarı", "Süt/yem kaydı için tarih ve saat giriniz.");
      return false;
    }

    if (!verimForm.yemTuketimi || !verimForm.sutVerimi) {
      Alert.alert("Uyarı", "Yem tüketimi ve süt verimi birlikte girilmelidir.");
      return false;
    }

    return true;
  };

  const verimDurumuBelirle = (sut) => {
    if (sut < 3) return "Düşük Verim";
    if (sut < 4) return "Orta Verim";
    return "Normal Verim";
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!verimKaydiGecerliMi()) return;

    setSaving(true);

    const hayvanBody = {
      kupeNo: form.kupeNo,
      ad: form.ad,
      cins: form.cins,
      yas: Number(form.yas) || 0,
      agirlik: Number(form.agirlik) || 0,
    };

    try {
      const hayvanUrl = editId
        ? `${API_BASE_URL}/api/hayvanlar/${editId}`
        : `${API_BASE_URL}/api/hayvanlar/${form.tur}`;

      const hayvanRes = await fetch(hayvanUrl, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hayvanBody),
      });

      if (!hayvanRes.ok) throw new Error("Hayvan kaydı başarısız.");

      const savedAnimal = await hayvanRes.json().catch(() => null);
      const hayvanId = editId || savedAnimal?.id;

      if (verimKaydiVarMi() && hayvanId) {
        const sut = Number(verimForm.sutVerimi) || 0;

        const verimBody = {
          tarih: verimForm.tarih,
          saat: verimForm.saat,
          hayvanId: Number(hayvanId),
          yemTuketimi: Number(verimForm.yemTuketimi) || 0,
          sutVerimi: sut,
          durum: verimDurumuBelirle(sut),
        };

        const verimRes = await fetch(`${API_BASE_URL}/api/analysis-productivity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(verimBody),
        });

        if (!verimRes.ok) {
          throw new Error("Süt/yem verisi kaydedilemedi.");
        }
      }

      Alert.alert(
        "Başarılı",
        verimKaydiVarMi()
          ? "Hayvan kaydı ve süt/yem verisi kaydedildi."
          : editId
          ? "Hayvan kaydı güncellendi."
          : "Yeni hayvan eklendi."
      );

      temizleForm();
      fetchHayvanlar();
    } catch (error) {
      console.error("Kayıt hatası:", error);
      Alert.alert("Hata", "Kayıt sırasında bir sorun oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setForm({
      kupeNo: String(item.kupeNo || ""),
      ad: String(item.ad || ""),
      cins: String(item.cins || ""),
      yas: String(item.yas || ""),
      agirlik: String(item.agirlik || ""),
      tur: String(item.tur || "inek"),
    });
  };

  const handleDelete = (id) => {
    Alert.alert("Hayvanı Sil", "Bu kaydı silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/hayvanlar/${id}`, {
              method: "DELETE",
            });

            if (!res.ok) throw new Error("Silme başarısız");

            Alert.alert("Başarılı", "Kayıt silindi.");
            if (editId === id) temizleForm();
            fetchHayvanlar();
          } catch (error) {
            Alert.alert("Hata", "Silme işlemi tamamlanamadı.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Hayvan kayıtları yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.pageMini}>AKILLI AHIR</Text>
          <Text style={styles.pageTitle}>Hayvan Yönetimi</Text>
          <Text style={styles.pageSubTitle}>
            Hayvan kaydı oluştur, güncelle ve günlük süt/yem verisini analiz sistemine aktar.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name={editId ? "pencil-circle" : "plus-circle"}
              size={28}
              color="#22c55e"
            />
            <Text style={styles.cardTitle}>
              {editId ? "Hayvan Kaydını Güncelle" : "Yeni Hayvan Kaydı"}
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Küpe No</Text>
              <TextInput
                style={styles.input}
                value={form.kupeNo}
                onChangeText={(v) => handleChange("kupeNo", v)}
                placeholder="TR001"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Ad</Text>
              <TextInput
                style={styles.input}
                value={form.ad}
                onChangeText={(v) => handleChange("ad", v)}
                placeholder="Sarıkız"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <Text style={styles.label}>Cins</Text>
          <TextInput
            style={styles.input}
            value={form.cins}
            onChangeText={(v) => handleChange("cins", v)}
            placeholder="Holstein / Simental"
            placeholderTextColor="#64748b"
          />

          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Yaş</Text>
              <TextInput
                style={styles.input}
                value={form.yas}
                onChangeText={(v) => handleChange("yas", v)}
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Ağırlık (kg)</Text>
              <TextInput
                style={styles.input}
                value={form.agirlik}
                onChangeText={(v) => handleChange("agirlik", v)}
                keyboardType="numeric"
                placeholder="550"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          {!editId && (
            <View style={styles.typeContainer}>
              <Text style={styles.label}>Tür Seçimi</Text>
              <View style={styles.typeRow}>
                {["inek", "buzağı"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, form.tur === t && styles.typeBtnActive]}
                    onPress={() => handleChange("tur", t)}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        form.tur === t && styles.typeBtnTextActive,
                      ]}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-line" size={27} color="#a78bfa" />
            <Text style={styles.cardTitle}>Günlük Süt / Yem Kaydı</Text>
          </View>

          <Text style={styles.infoNote}>
            Bu alan doldurulursa kayıt aynı zamanda analiz verim tablosuna kaydedilir.
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Tarih</Text>
              <TextInput
                style={styles.input}
                value={verimForm.tarih}
                onChangeText={(v) => handleVerimChange("tarih", v)}
                placeholder="2026-05-23"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Saat</Text>
              <TextInput
                style={styles.input}
                value={verimForm.saat}
                onChangeText={(v) => handleVerimChange("saat", v)}
                placeholder="08:00"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Yem Tüketimi (kg)</Text>
              <TextInput
                style={styles.input}
                value={verimForm.yemTuketimi}
                onChangeText={(v) => handleVerimChange("yemTuketimi", v)}
                keyboardType="numeric"
                placeholder="6"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Süt Verimi (L)</Text>
              <TextInput
                style={styles.input}
                value={verimForm.sutVerimi}
                onChangeText={(v) => handleVerimChange("sutVerimi", v)}
                keyboardType="numeric"
                placeholder="3.8"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {editId ? "Güncelle ve Kaydet" : "Hayvanı ve Verimi Kaydet"}
                </Text>
              )}
            </TouchableOpacity>

            {editId && (
              <TouchableOpacity style={styles.cancelBtn} onPress={temizleForm}>
                <MaterialCommunityIcons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Kayıtlı Hayvanlar</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{hayvanlar.length}</Text>
          </View>
        </View>

        {hayvanlar.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="cow-off" size={48} color="#475569" />
            <Text style={styles.emptyTitle}>Henüz Kayıt Yok</Text>
          </View>
        ) : (
          hayvanlar.map((item) => (
            <View key={item.id} style={styles.hayvanCard}>
              <View style={styles.hayvanTop}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="cow" size={26} color="#22c55e" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.hayvanName}>{item.ad || "İsimsiz"}</Text>
                  <Text style={styles.hayvanSub}>Küpe: {item.kupeNo}</Text>
                </View>

                <View style={styles.actionIcons}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.miniBtn}>
                    <MaterialCommunityIcons name="pencil" size={20} color="#60a5fa" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.miniBtn}>
                    <MaterialCommunityIcons name="delete" size={20} color="#f87171" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <Text style={styles.infoText}>🧬 Cins: {item.cins}</Text>
                <Text style={styles.infoText}>📅 Yaş: {item.yas}</Text>
                <Text style={styles.infoText}>⚖️ Ağırlık: {item.agirlik} kg</Text>
                <Text style={styles.infoText}>🏷️ Tür: {item.tur || "-"}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  scroll: { padding: 18, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
  },
  loadingText: { color: "#94a3b8", marginTop: 12, fontSize: 14 },

  headerCard: {
    backgroundColor: "#0f172a",
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 18,
  },
  pageMini: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  pageTitle: { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 5 },
  pageSubTitle: { color: "#94a3b8", fontSize: 13, marginTop: 8, lineHeight: 20 },

  formCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 18,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginLeft: 10 },

  inputRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  halfInput: { flex: 1 },
  label: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#111827",
    color: "#fff",
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 15,
    marginBottom: 10,
  },
  infoNote: {
    color: "#c4b5fd",
    backgroundColor: "rgba(124,58,237,0.12)",
    borderColor: "rgba(167,139,250,0.25)",
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },

  typeContainer: { marginTop: 5 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  typeBtnActive: { backgroundColor: "#22c55e", borderColor: "#22c55e" },
  typeBtnText: { color: "#94a3b8", fontWeight: "800" },
  typeBtnTextActive: { color: "#fff" },

  buttonRow: { flexDirection: "row", marginTop: 10, gap: 10 },
  saveBtn: {
    flex: 1,
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  cancelBtn: {
    backgroundColor: "#334155",
    width: 55,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  listHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15, marginTop: 5 },
  listTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  countBadge: {
    marginLeft: 12,
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countBadgeText: { color: "#fff", fontWeight: "900" },

  hayvanCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 15,
  },
  hayvanTop: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(34,197,94,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  hayvanName: { color: "#fff", fontSize: 18, fontWeight: "900" },
  hayvanSub: { color: "#64748b", fontSize: 13, fontWeight: "700" },
  actionIcons: { flexDirection: "row", gap: 5 },
  miniBtn: { padding: 8, backgroundColor: "#1e293b", borderRadius: 12 },

  infoGrid: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoText: { color: "#cbd5e1", fontSize: 13, width: "45%", fontWeight: "700" },

  emptyCard: { alignItems: "center", marginTop: 50 },
  emptyTitle: { color: "#475569", fontSize: 18, fontWeight: "800", marginTop: 10 },
});