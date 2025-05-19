import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../credenciales';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Verificar si hay credenciales guardadas
    const checkStoredCredentials = async () => {
      const storedEmail = await AsyncStorage.getItem('email');
      const storedPassword = await AsyncStorage.getItem('password');
      if (storedEmail && storedPassword) {
        setEmail(storedEmail);
        setPassword(storedPassword);
        handleLogin(storedEmail, storedPassword); // Autenticar automáticamente
      }
    };
    checkStoredCredentials();
  }, []);

  const handleLogin = (storedEmail, storedPassword) => {
    const userEmail = storedEmail || email;
    const userPassword = storedPassword || password;

    signInWithEmailAndPassword(auth, userEmail, userPassword)
      .then((userCredential) => {
        Alert.alert('Login exitoso', `Bienvenido ${userCredential.user.email}`);
        if (rememberMe) {
          // Guardar credenciales si "Recuérdame" está activado
          AsyncStorage.setItem('email', userEmail);
          AsyncStorage.setItem('password', userPassword);
        } else {
          // Limpiar credenciales si "Recuérdame" no está activado
          AsyncStorage.removeItem('email');
          AsyncStorage.removeItem('password');
        }
        navigation.navigate('Home'); // Redirige al Home después del login exitoso
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
      });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.options}>
        <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
          <Text style={[styles.remember, rememberMe && styles.rememberActive]}>
            {rememberMe ? '✓ Recuérdame' : 'Recuérdame'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => handleLogin()}>
        <Text style={styles.buttonText}>INGRESAR</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.register}>
          No tienes una cuenta? <Text style={styles.registerLink}>Crea una cuenta!</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFA500',
    padding: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  remember: {
    fontSize: 14,
    color: '#fff',
  },
  rememberActive: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  forgot: {
    fontSize: 14,
    color: '#fff',
    textDecorationLine: 'underline',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#000',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  register: {
    fontSize: 14,
    color: '#fff',
  },
  registerLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});