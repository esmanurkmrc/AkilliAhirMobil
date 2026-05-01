import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Config dosyanızdan URL'i import ediyoruz
import { API_BASE_URL } from './config'; // Dosya yolunu kontrol edin

const { width, height } = Dimensions.get('window');

export default function Kayitpage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Yüklenme durumu

  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    email: '',
    sifre: '',
  });

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    // Tüm alanların doluluk kontrolü
    if (!formData.ad || !formData.soyad || !formData.email || !formData.sifre) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true); // İşlem başladı

    try {
      // Config dosyasındaki baz URL kullanılıyor
      const response = await fetch(`${API_BASE_URL}/api/users/kayit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Sisteme başarıyla kayıt olundu!', [
          { text: 'Tamam', onPress: () => router.push('/login') },
        ]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Hata', errorData.message || 'Kayıt işlemi başarısız.');
      }
    } catch (error) {
      console.error("Kayıt Hatası:", error);
      Alert.alert(
        'Bağlantı Hatası',
        'Sunucuya ulaşılamadı. Lütfen internet bağlantınızı ve IP adresinizi kontrol edin.'
      );
    } finally {
      setLoading(false); // İşlem bitti
    }
  };

  const backgroundImage = require('../assets/images/resim2.jpeg');

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardArea}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.topSection}>
                <Text style={styles.mainTitle}>AKILLI AHIR</Text>
                <Text style={styles.subTitle}>İzleme ve Analiz Sistemi</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={28}
                    color="#2f80ed"
                  />
                </View>

                <Text style={styles.cardTitle}>Kayıt Ol</Text>
                <Text style={styles.cardSubtitle}>
                  Bilgilerini girerek yeni bir hesap oluştur
                </Text>

                <View style={styles.formArea}>
                  {/* Ad Alanı */}
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={20} color="#ffffff" />
                    <TextInput
                      style={styles.input}
                      placeholder="Ad"
                      placeholderTextColor="rgba(255,255,255,0.78)"
                      value={formData.ad}
                      onChangeText={(val) => handleChange('ad', val)}
                    />
                  </View>

                  {/* Soyad Alanı */}
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={20} color="#ffffff" />
                    <TextInput
                      style={styles.input}
                      placeholder="Soyad"
                      placeholderTextColor="rgba(255,255,255,0.78)"
                      value={formData.soyad}
                      onChangeText={(val) => handleChange('soyad', val)}
                    />
                  </View>

                  {/* E-posta Alanı */}
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#ffffff" />
                    <TextInput
                      style={styles.input}
                      placeholder="E-posta Adresi"
                      placeholderTextColor="rgba(255,255,255,0.78)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(val) => handleChange('email', val)}
                    />
                  </View>

                  {/* Şifre Alanı */}
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color="#ffffff" />
                    <TextInput
                      style={styles.input}
                      placeholder="Şifre"
                      placeholderTextColor="rgba(255,255,255,0.78)"
                      secureTextEntry
                      value={formData.sifre}
                      onChangeText={(val) => handleChange('sifre', val)}
                    />
                  </View>

                  {/* Kayıt Butonu */}
                  <TouchableOpacity
                    style={[styles.registerButton, loading && { opacity: 0.7 }]}
                    activeOpacity={0.85}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.registerButtonText}>Kaydı Tamamla</Text>
                    )}
                  </TouchableOpacity>

                  {/* Giriş Linki */}
                  <TouchableOpacity
                    style={styles.loginArea}
                    onPress={() => router.push('/login')}
                  >
                    <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
                    <Text style={styles.linkText}>Giriş Yap</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { width, height },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)' },
  safeArea: { flex: 1 },
  keyboardArea: { flex: 1 },
  scrollContent: {
    minHeight: height,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  topSection: { alignItems: 'center', marginBottom: 24 },
  mainTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subTitle: { marginTop: 6, fontSize: 17, color: '#f5f5f5', textAlign: 'center' },
  card: {
    width: '100%',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  iconCircle: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.28)',
    marginBottom: 12,
  },
  cardTitle: { textAlign: 'center', color: '#ffffff', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  cardSubtitle: { textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 22 },
  formArea: { width: '100%' },
  inputWrapper: {
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#fff' },
  registerButton: {
    marginTop: 8,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  loginArea: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  footerText: { color: '#fff', fontSize: 15 },
  linkText: { color: '#90caf9', fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
});