import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions, 
  ImageBackground, 
  StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function Anasayfapage() {
  const router = useRouter();

  const backgroundImage = require('../assets/images/resim2.jpeg');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ImageBackground 
        source={backgroundImage} 
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          
          <View style={styles.contentContainer}>
         
            <View style={styles.textWrapper}>
              <Text style={styles.mainText}>Ahır İçi{"\n"}Mikroklima</Text>
              <View style={styles.line} />
              <Text style={styles.subText}>İzleme ve Analiz Sistemi</Text>
            </View>

            {/* Buton */}
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push('/kayit')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Sisteme Giriş Yap</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
    justifyContent: 'flex-start', 
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    width: '100%',
    paddingTop: height * 0.10, 
  },
  textWrapper: {
    alignItems: 'center',
    marginBottom: 40, 
  },
  mainText: {
    fontSize: 30, 
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
    lineHeight: 45,
  },
  line: {
    width: 60,
    height: 4,
    backgroundColor: '#3498db',
    marginVertical: 15,
    borderRadius: 2,
  },
  subText: {
    fontSize: 18,
    color: '#f1f2f6',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 18,
    width: '85%',
    borderRadius: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});