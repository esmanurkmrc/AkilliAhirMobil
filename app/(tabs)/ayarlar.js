import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Ayarlar() {
  const defaultSettings = {
    ad: 'Kullanıcı',
    soyad: '',
    email: 'ornek@mail.com',
    amonyakLimit: '25',
    sicaklikLimit: '24',
    nemLimit: '80',
    bildirimAcik: true,
    otomatikYenileme: true,
    koyuTema: true,
    alarmSesi: true,
  };

  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('user_settings');
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.log('Yükleme hatası', e);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('user_settings', JSON.stringify(settings));
      Alert.alert('Başarılı', 'Ayarlar kaydedildi.');
    } catch {
      Alert.alert('Hata', 'Ayarlar kaydedilemedi.');
    }
  };

  const resetSettings = async () => {
    await AsyncStorage.removeItem('user_settings');
    setSettings(defaultSettings);
    Alert.alert('Sıfırlandı', 'Tüm ayarlar varsayılan hale getirildi.');
  };

  const theme = settings.koyuTema
    ? {
        bg: '#020617',
        card: '#0f172a',
        card2: '#111827',
        text: '#ffffff',
        sub: '#94a3b8',
        input: '#111827',
        border: '#1e293b',
        primary: '#22c55e',
      }
    : {
        bg: '#f8fafc',
        card: '#ffffff',
        card2: '#f1f5f9',
        text: '#0f172a',
        sub: '#64748b',
        input: '#f1f5f9',
        border: '#e2e8f0',
        primary: '#16a34a',
      };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={settings.koyuTema ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.miniTitle, { color: theme.primary }]}>AKILLI AHIR</Text>
            <Text style={[styles.title, { color: theme.text }]}>Ayarlar</Text>
            <Text style={[styles.subtitle, { color: theme.sub }]}>
              Profil, eşik değerleri ve uygulama tercihleri
            </Text>
          </View>

          <View style={[styles.headerIcon, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="cog-outline" size={30} color={theme.primary} />
          </View>
        </View>

        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={34} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {settings.ad || 'Kullanıcı'} {settings.soyad}
            </Text>
            <Text style={[styles.profileMail, { color: theme.sub }]}>
              {settings.email}
            </Text>
          </View>
        </View>

        <SectionCard title="Profil Bilgileri" icon="account-edit" theme={theme}>
          <InputItem
            label="Ad"
            value={settings.ad}
            placeholder="Adınızı giriniz"
            theme={theme}
            onChangeText={(v) => updateSetting('ad', v)}
          />

          <InputItem
            label="Soyad"
            value={settings.soyad}
            placeholder="Soyadınızı giriniz"
            theme={theme}
            onChangeText={(v) => updateSetting('soyad', v)}
          />

          <InputItem
            label="Email"
            value={settings.email}
            placeholder="Email adresi"
            theme={theme}
            onChangeText={(v) => updateSetting('email', v)}
          />
        </SectionCard>

        <SectionCard title="Eşik Değerler" icon="alert-circle-outline" theme={theme}>
          <View style={styles.limitGrid}>
            <LimitInput
              title="Amonyak"
              value={settings.amonyakLimit}
              unit="ppm"
              icon="chemical-weapon"
              color="#a855f7"
              theme={theme}
              onChangeText={(v) => updateSetting('amonyakLimit', v)}
            />

            <LimitInput
              title="Sıcaklık"
              value={settings.sicaklikLimit}
              unit="°C"
              icon="thermometer"
              color="#f97316"
              theme={theme}
              onChangeText={(v) => updateSetting('sicaklikLimit', v)}
            />

            <LimitInput
              title="Nem"
              value={settings.nemLimit}
              unit="%"
              icon="water-percent"
              color="#38bdf8"
              theme={theme}
              onChangeText={(v) => updateSetting('nemLimit', v)}
            />
          </View>
        </SectionCard>

        <SectionCard title="Uygulama Tercihleri" icon="tune-variant" theme={theme}>
          <SwitchRow
            label="Bildirimler"
            desc="Riskli durumlarda uyarı göster"
            icon="bell-ring-outline"
            value={settings.bildirimAcik}
            theme={theme}
            onChange={(v) => updateSetting('bildirimAcik', v)}
          />

          <SwitchRow
            label="Otomatik Yenileme"
            desc="Canlı verileri belirli aralıklarla güncelle"
            icon="refresh"
            value={settings.otomatikYenileme}
            theme={theme}
            onChange={(v) => updateSetting('otomatikYenileme', v)}
          />

          <SwitchRow
            label="Koyu Tema"
            desc="Premium koyu arayüz kullan"
            icon="theme-light-dark"
            value={settings.koyuTema}
            theme={theme}
            onChange={(v) => updateSetting('koyuTema', v)}
          />

          <SwitchRow
            label="Alarm Sesi"
            desc="Kritik uyarılarda sesli alarm"
            icon="volume-high"
            value={settings.alarmSesi}
            theme={theme}
            onChange={(v) => updateSetting('alarmSesi', v)}
          />
        </SectionCard>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          onPress={saveSettings}
        >
          <MaterialCommunityIcons name="content-save-check" size={22} color="#fff" />
          <Text style={styles.saveBtnText}>Ayarları Kaydet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.resetBtn, { borderColor: '#ef4444' }]}
          onPress={resetSettings}
        >
          <MaterialCommunityIcons name="restore" size={20} color="#ef4444" />
          <Text style={styles.resetText}>Varsayılana Sıfırla</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({ title, icon, children, theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${theme.primary}22` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={theme.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>

      {children}
    </View>
  );
}

function InputItem({ label, value, placeholder, onChangeText, theme }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.sub }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.input,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.sub}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function LimitInput({ title, value, unit, icon, color, onChangeText, theme }) {
  return (
    <View style={[styles.limitCard, { backgroundColor: theme.card2, borderColor: theme.border }]}>
      <View style={[styles.limitIcon, { backgroundColor: `${color}22` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>

      <Text style={[styles.limitTitle, { color: theme.sub }]}>{title}</Text>

      <View style={styles.limitInputRow}>
        <TextInput
          style={[styles.limitInput, { color: theme.text }]}
          keyboardType="numeric"
          value={value}
          onChangeText={onChangeText}
        />
        <Text style={[styles.limitUnit, { color: theme.sub }]}>{unit}</Text>
      </View>
    </View>
  );
}

function SwitchRow({ label, desc, icon, value, onChange, theme }) {
  return (
    <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
      <View style={styles.switchLeft}>
        <View style={[styles.switchIcon, { backgroundColor: `${theme.primary}1A` }]}>
          <MaterialCommunityIcons name={icon} size={21} color={theme.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.switchDesc, { color: theme.sub }]}>{desc}</Text>
        </View>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#334155', true: '#86efac' }}
        thumbColor={value ? theme.primary : '#94a3b8'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scroll: {
    padding: 18,
    paddingBottom: 42,
  },

  header: {
    marginTop: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  miniTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  title: {
    fontSize: 31,
    fontWeight: '900',
    marginTop: 4,
  },

  subtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
    maxWidth: 260,
  },

  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  profileCard: {
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  profileName: {
    fontSize: 19,
    fontWeight: '900',
  },

  profileMail: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },

  card: {
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
  },

  inputGroup: {
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
    marginLeft: 4,
  },

  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '600',
  },

  limitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  limitCard: {
    width: '31%',
    borderRadius: 19,
    padding: 12,
    borderWidth: 1,
  },

  limitIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  limitTitle: {
    fontSize: 11,
    fontWeight: '800',
  },

  limitInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },

  limitInput: {
    fontSize: 20,
    fontWeight: '900',
    padding: 0,
    minWidth: 32,
  },

  limitUnit: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 2,
    marginBottom: 3,
  },

  switchRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  switchLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  switchIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  switchLabel: {
    fontSize: 15,
    fontWeight: '900',
  },

  switchDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
    fontWeight: '600',
  },

  saveBtn: {
    marginTop: 4,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },

  resetBtn: {
    marginTop: 12,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  resetText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 7,
  },
});