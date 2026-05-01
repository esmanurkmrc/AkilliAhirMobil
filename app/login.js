import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator // Yükleniyor ikonu için eklendi
  ,
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Config dosyanızdan URL'i import ediyoruz
import { API_BASE_URL } from './config'; // Config dosyanızın yolunu kontrol edin

const { width, height } = Dimensions.get('window');

export default function Girispage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
    // Boş alan kontrolü
    if (!formData.email || !formData.sifre) {
      Alert.alert('Uyarı', 'Lütfen e-posta ve şifre girin.');
      return;
    }

    setLoading(true);

    try {
      // Config'den gelen URL'i kullanıyoruz
      const response = await fetch(`${API_BASE_URL}/api/users/giris`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Başarılı',
          `Hoş geldin ${data.ad || ''}`,
          [{ text: 'Tamam', onPress: () => router.replace('/dashboard') }]
        );
      } else {
        // Sunucudan dönen hata mesajını göster (örn: "Şifre yanlış")
        Alert.alert('Hata', data.message || 'E-posta veya şifre hatalı.');
      }
    } catch (error) {
      console.error("Giriş Hatası:", error);
      Alert.alert('Hata', 'Sunucuya bağlanılamadı! Lütfen internet bağlantınızı ve IP adresinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const backgroundImage = require('../assets/images/resim2.jpeg');

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
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
                    name="lock-outline"
                    size={26}
                    color="#2f80ed"
                  />
                </View>

                <Text style={styles.cardTitle}>Giriş Yap</Text>
                <Text style={styles.cardSubtitle}>
                  Hesabına giriş yaparak devam et
                </Text>

                <View style={styles.formArea}>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#fff" />
                    <TextInput
                      style={styles.input}
                      placeholder="E-posta"
                      placeholderTextColor="rgba(255,255,255,0.75)"
                      value={formData.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onChangeText={(val) => handleChange('email', val)}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color="#fff" />
                    <TextInput
                      style={styles.input}
                      placeholder="Şifre"
                      placeholderTextColor="rgba(255,255,255,0.75)"
                      secureTextEntry
                      value={formData.sifre}
                      onChangeText={(val) => handleChange('sifre', val)}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.loginButton, loading && { opacity: 0.7 }]} 
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginButtonText}>Giriş Yap</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => router.push('/kayit')}>
                    <Text style={styles.footerText}>
                      Hesabın yok mu? <Text style={styles.linkText}>Kayıt Ol</Text>
                    </Text>
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

// Styles kısmında değişiklik yapmadım, mevcut tasarımınız gayet güzel.
const styles = StyleSheet.create({
    // ... Sizin mevcut stilleriniz aynen kalabilir
    background: { width, height },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)' },
    safeArea: { flex: 1 },
    keyboardArea: { flex: 1 },
    scrollContent: { minHeight: height, paddingHorizontal: 24, justifyContent: 'center' },
    topSection: { alignItems: 'center', marginBottom: 25 },
    mainTitle: { fontSize: 36, fontWeight: '900', color: '#fff' },
    subTitle: { color: '#f1f1f1', marginTop: 5 },
    card: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 25, padding: 20 },
    iconCircle: { alignSelf: 'center', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cardTitle: { textAlign: 'center', color: '#fff', fontSize: 24, fontWeight: 'bold' },
    cardSubtitle: { textAlign: 'center', color: '#eee', marginBottom: 20 },
    formArea: { width: '100%' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 15, paddingHorizontal: 15, height: 55, marginBottom: 12 },
    input: { flex: 1, marginLeft: 10, color: '#fff' },
    loginButton: { backgroundColor: '#3498db', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    loginButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    footerText: { textAlign: 'center', marginTop: 15, color: '#fff' },
    linkText: { color: '#90caf9', fontWeight: 'bold' },
});