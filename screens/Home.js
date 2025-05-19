import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Modal, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { FontAwesome } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import MapView, { Marker } from 'react-native-maps';
import { auth, db } from '../credenciales';
import { collection, getDocs } from 'firebase/firestore';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || user.email);
    }
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}
        onPress={() => navigation.openDrawer()}
      >
        <FontAwesome name="bars" size={28} color="#FFA500" />
      </TouchableOpacity>
      <Text style={styles.welcomeText}>Hola, {userName}</Text>
    </View>
  );
}

function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        try {
          const { status } = await BarCodeScanner.requestPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch (error) {
          console.error("Error solicitando permisos del escáner:", error);
          setHasPermission(false);
        }
      } else {
        setHasPermission(false);
      }
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    alert(`Código QR escaneado: ${data}`);
  };

  if (Platform.OS === 'android' && !BarCodeScanner.scanFromURLAsync) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red', padding: 20, textAlign: 'center' }}>
          El escáner QR no está disponible en Expo Go con la nueva arquitectura.
          Por favor usa `npx expo run:android` para probar esta funcionalidad.
        </Text>
      </View>
    );
  }

  if (hasPermission === null) {
    return <Text>Solicitando permiso para usar la cámara...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No se concedió permiso para usar la cámara.</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <Text style={styles.scanAgain} onPress={() => setScanned(false)}>
          Toca para escanear de nuevo
        </Text>
      )}
    </View>
  );
}

function MapScreen() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchUbicaciones = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'ubicaciones'));
        const ubicaciones = [];
        querySnapshot.forEach((doc) => {
          ubicaciones.push(doc.data());
        });
        setMarkers(ubicaciones);
        setLoading(false);
      } catch (error) {
        console.error("Error obteniendo ubicaciones: ", error);
        setLoading(false);
      }
    };

    fetchUbicaciones();
  }, []);

  const handleMarkerPress = (index) => {
    setSelectedMarker(index);
    setModalVisible(true);
    scaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapType="standard"
        showsUserLocation={true}
        showsCompass={true}
        initialRegion={{
          latitude: -36.795048,
          longitude: -73.062398,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Marcador fijo de prueba */}
        <Marker
          coordinate={{ latitude: -36.795048, longitude: -73.062398 }}
        >
          <FontAwesome name="map-marker" size={44} color="#FFA500" />
        </Marker>
        {/* Marcadores de Firestore */}
        {markers.map((ubicacion, index) => (
  <Marker
    key={index}
    coordinate={{
      latitude: ubicacion.latitud,
      longitude: ubicacion.longitud,
    }}
    onPress={() => handleMarkerPress(index)}
    tracksViewChanges={false}
  >
    <Animated.View style={{ transform: [{ scale: selectedMarker === index ? scaleAnim : 1 }] }}>
      <FontAwesome name="map-marker" size={44} color="#FFA500" />
    </Animated.View>
  </Marker>
))}
      </MapView>

      {/* Modal sobrepuesto */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#FFA500', marginBottom: 10, textAlign: 'center' }}>
              {selectedMarker !== null && markers[selectedMarker]?.nombre}
            </Text>
            {selectedMarker !== null && markers[selectedMarker]?.direccion && (
              <Text style={{ color: '#333', fontSize: 16, textAlign: 'center' }}>
                {markers[selectedMarker]?.direccion}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function ProfileScreen() {
  const user = auth.currentUser;
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Perfil</Text>
      <Text>Nombre: {user?.displayName || user?.email}</Text>
      <Text>Email: {user?.email}</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Configuración</Text>
    </View>
  );
}

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem
        label="Perfil"
        icon={({ color, size }) => <FontAwesome name="user" color={color} size={size} />}
        onPress={() => props.navigation.navigate('Perfil')}
      />
      <DrawerItem
        label="Configuración"
        icon={({ color, size }) => <FontAwesome name="cog" color={color} size={size} />}
        onPress={() => props.navigation.navigate('Configuración')}
      />
      <DrawerItem
        label="Cerrar sesión"
        icon={({ color, size }) => <FontAwesome name="sign-out" color={color} size={size} />}
        onPress={() => {
          auth.signOut();
          props.navigation.replace('Login');
        }}
      />
    </DrawerContentScrollView>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Inicio') {
            iconName = 'home';
          } else if (route.name === 'Escanear QR') {
            iconName = 'qrcode';
          } else if (route.name === 'Mapa') {
            iconName = 'map';
          }
          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFA500',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Escanear QR" component={QRScannerScreen} />
      <Tab.Screen name="Mapa" component={MapScreen} />
    </Tab.Navigator>
  );
}

export default function Home() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="Principal" component={MainTabs} />
      <Drawer.Screen name="Perfil" component={ProfileScreen} />
      <Drawer.Screen name="Configuración" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA500',
  },
  scanAgain: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFA500',
    textDecorationLine: 'underline',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    minWidth: 220,
    alignItems: 'center',
    elevation: 8,
  },
});