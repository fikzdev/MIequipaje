import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function Welcome({ navigation }) {
  useEffect(() => {
    // Navegar automáticamente al login después de 3 segundos
    const timer = setTimeout(() => {
      navigation.replace('Login'); // Reemplaza la pantalla actual con Login
    }, 3000);

    return () => clearTimeout(timer); // Limpiar el temporizador al desmontar
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')} // Asegúrate de tener un logo en la carpeta assets
        style={styles.logo}
      />
      <Text style={styles.title}>Bienvenido a MIequipaje</Text>
      <Text style={styles.subtitle}>¡Disfruta sin obstáculos en tus manos!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 350,
    height: 350,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});