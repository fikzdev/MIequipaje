import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Modal, Animated, TextInput, useColorScheme } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { FontAwesome } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import MapView, { Marker } from 'react-native-maps';
import { auth, db } from '../credenciales';
import { collection, getDocs } from 'firebase/firestore';
import { SafeAreaView } from 'react-native';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const colorScheme = useColorScheme();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || user.email);
    }
  }, []);

  return (
    <SafeAreaView style={[
      styles.homeContainer,
      { backgroundColor: colorScheme === 'dark' ? '#2d2233' : '#fff', flex: 1 }
    ]}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}
        onPress={() => navigation.openDrawer()}
      >
        <FontAwesome name="bars" size={28} color={colorScheme === 'dark' ? "#FFA500" : "#FFC72C"} />
      </TouchableOpacity>
      <Text style={[
        styles.welcomeText,
        { color: colorScheme === 'dark' ? '#FFA500' : '#222' }
      ]}>
        Hola, {userName}
      </Text>
    </SafeAreaView>
  );
}

function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        try {
          const { status } = await BarCodeScanner.requestPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch (error) {
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
      <View style={[
        styles.homeContainer,
        { backgroundColor: colorScheme === 'dark' ? '#2d2233' : '#fff' }
      ]}>
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
    <View style={[
      styles.homeContainer,
      { backgroundColor: colorScheme === 'dark' ? '#2d2233' : '#fff' }
    ]}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <Text style={[
          styles.scanAgain,
          { color: colorScheme === 'dark' ? '#FFA500' : '#222' }
        ]} onPress={() => setScanned(false)}>
          Toca para escanear de nuevo
        </Text>
      )}
    </View>
  );
}

function MapScreen({ navigation }) {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lockers, setLockers] = useState([]);
  const [lockerError, setLockerError] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();

  useEffect(() => {
    const fetchUbicaciones = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Ubicacion'));
        const ubicaciones = [];
        querySnapshot.forEach((doc) => {
          ubicaciones.push({ ...doc.data(), id: doc.id });
        });
        setMarkers(ubicaciones);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchUbicaciones();
  }, []);

  // Nueva función para traer todos los lockers
  const fetchLockers = async (ubicacionId) => {
    try {
      setLockerError(false);
      const lockersRef = collection(db, 'Ubicacion', ubicacionId, 'lockers');
      const lockersSnapshot = await getDocs(lockersRef);
      const lockersArr = [];
      lockersSnapshot.forEach((doc) => {
        lockersArr.push({ id: doc.id, ...doc.data() });
      });
      setLockers(lockersArr);
    } catch (error) {
      setLockers([]);
      setLockerError(true);
    }
  };

  const handleMarkerPress = async (index) => {
    setSelectedMarker(index);
    setModalVisible(true);
    setLockers([]);
    setLockerError(false);
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

    const marker = markers[index];
    if (marker && marker.id) {
      await fetchLockers(marker.id);
    }
  };

  const handleFixedMarkerPress = async () => {
    setSelectedMarker(null);
    setModalVisible(true);
    setLockers([]);
    setLockerError(false);
    if (markers.length > 0 && markers[0].id) {
      await fetchLockers(markers[0].id);
    } else {
      setLockerError(true);
    }
  };

  if (loading) {
    return (
      <View style={[
        styles.homeContainer,
        { backgroundColor: colorScheme === 'dark' ? '#2d2233' : '#fff' }
      ]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? "#FFA500" : "#FFC72C"} />
        <Text style={{ color: colorScheme === 'dark' ? "#FFA500" : "#222" }}>Cargando mapa...</Text>
      </View>
    );
  }

  const mapStyle = colorScheme === 'dark' ? darkMapStyle : [];

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#2d2233' : '#fff' }}>
      {/* Barra de búsqueda */}
      <View style={[
        styles.searchBarContainer,
        {
          backgroundColor: colorScheme === 'dark' ? '#2d2233' : '#f5f5f5',
        }
      ]}>
        <FontAwesome name="search" size={20} color="#aaa" style={{ marginLeft: 10 }} />
        <TextInput
          style={[
            styles.searchInput,
            { color: colorScheme === 'dark' ? '#fff' : '#222' }
          ]}
          placeholder="¿Adónde?"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Mapa */}
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
        customMapStyle={mapStyle}
      >
        {/* Marcador fijo de prueba */}
        <Marker
          coordinate={{ latitude: -36.795048, longitude: -73.062398 }}
          onPress={handleFixedMarkerPress}
        >
          <FontAwesome name="map-marker" size={44} color={colorScheme === 'dark' ? "#FFA500" : "#FFA500"} />
        </Marker>
        {/* Marcadores de Firestore */}
        {markers.map((ubicacion, index) => (
          <Marker
            key={ubicacion.id || index}
            coordinate={{
              latitude: ubicacion.latitud,
              longitude: ubicacion.longitud,
            }}
            onPress={() => handleMarkerPress(index)}
            tracksViewChanges={false}
          >
            <Animated.View style={{ transform: [{ scale: selectedMarker === index ? scaleAnim : 1 }] }}>
              <FontAwesome name="map-marker" size={44} color={colorScheme === 'dark' ? "#FFA500" : "#FFA500"} />
            </Animated.View>
          </Marker>
        ))}
      </MapView>

      {/* Botón flotante para escanear QR */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colorScheme === 'dark' ? '#FFC72C' : '#FFA500' }
        ]}
        onPress={() => navigation.navigate('Escanear QR')}
        activeOpacity={0.8}
      >
        <FontAwesome name="qrcode" size={32} color={colorScheme === 'dark' ? "#222" : "#fff"} />
      </TouchableOpacity>

      {/* Modal sobrepuesto tipo bottom sheet */}
      <Modal
  visible={modalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setModalVisible(false)}
>
  <View style={{
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)'
  }}>
    <View style={{
      backgroundColor: colorScheme === 'dark' ? '#222' : '#fff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 32,
      alignItems: 'center',
      minHeight: 180,
      width: '100%'
    }}>
      <Text style={{
        fontWeight: 'bold',
        fontSize: 22,
        color: colorScheme === 'dark' ? '#FFA500' : '#FFA500',
        marginBottom: 10,
        textAlign: 'center'
      }}>
        {selectedMarker !== null && markers[selectedMarker]?.nombre
          ? markers[selectedMarker]?.nombre
          : markers[0]?.nombre || 'Nombre de prueba'}
      </Text>
      {lockerError ? (
        <Text style={{
          color: 'red',
          fontSize: 16,
          marginBottom: 10,
          textAlign: 'center'
        }}>
          No se pudieron cargar los lockers.
        </Text>
      ) : lockers.length === 0 ? (
        <Text style={{
          color: colorScheme === 'dark' ? '#fff' : '#222',
          fontSize: 16,
          marginBottom: 10,
          textAlign: 'center'
        }}>
          Cargando lockers...
        </Text>
      ) : (
        <View style={{
          width: '100%',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 10,
          marginBottom: 10,
        }}>
          {lockers.map((locker, idx) => {
            let bgColor = '#aaa';
            if (locker.estado === 'disponible') bgColor = '#4CAF50'; // verde
            else if (locker.estado === 'reservado') bgColor = '#FFA500'; // naranja
            else if (locker.estado === 'ocupado') bgColor = '#E53935'; // rojo

            return (
              <View
                key={locker.id}
                style={{
                  width: 40,
                  height: 60,
                  margin: 6,
                  backgroundColor: bgColor,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: '#222',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                {/* Manilla del locker */}
                <View style={{
                  width: 6,
                  height: 18,
                  backgroundColor: '#222',
                  borderRadius: 3,
                  position: 'absolute',
                  right: 6,
                  top: 21,
                }} />
                {/* Número o id corto */}
                <Text style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: 12,
                  position: 'absolute',
                  bottom: 4,
                  left: 0,
                  right: 0,
                  textAlign: 'center'
                }}>
                  {idx + 1}
                </Text>
              </View>
            );
          })}
        </View>
      )}
      <TouchableOpacity
        style={{ marginTop: 20 }}
        onPress={() => setModalVisible(false)}
      >
        <Text style={{ color: colorScheme === 'dark' ? '#FFA500' : '#FFA500', fontWeight: 'bold' }}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </View>
  );
}

// ...resto de tu código (ProfileScreen, SettingsScreen, CustomDrawerContent, MainTabs, Home, styles, etc.)...

function ProfileScreen() {
  const user = auth.currentUser;
  const colorScheme = useColorScheme();
  return (
    <View style={[
      styles.homeContainer,
      { backgroundColor: colorScheme === 'dark' ? '#2d2233' : '#fff' }
    ]}>
      <Text style={[
        styles.welcomeText,
        { color: colorScheme === 'dark' ? '#FFA500' : '#222' }
      ]}>Perfil</Text>
      <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#222' }}>Nombre: {user?.displayName || user?.email}</Text>
      <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#222' }}>Email: {user?.email}</Text>
    </View>
  );
}

function SettingsScreen() {
  const colorScheme = useColorScheme();
  return (
    <View style={[
      styles.homeContainer,
      { backgroundColor: colorScheme === 'dark' ? '#2d2233' : '#fff' }
    ]}>
      <Text style={[
        styles.welcomeText,
        { color: colorScheme === 'dark' ? '#FFA500' : '#222' }
      ]}>Configuración</Text>
    </View>
  );
}

function CustomDrawerContent(props) {
  const colorScheme = useColorScheme();
  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: colorScheme === 'dark' ? '#2d2233' : '#fff' }}>
      <DrawerItem
        label="Perfil"
        labelStyle={{ color: colorScheme === 'dark' ? '#FFA500' : '#222' }}
        icon={({ color, size }) => <FontAwesome name="user" color={colorScheme === 'dark' ? '#FFA500' : '#222'} size={size} />}
        onPress={() => props.navigation.navigate('Perfil')}
      />
      <DrawerItem
        label="Configuración"
        labelStyle={{ color: colorScheme === 'dark' ? '#FFA500' : '#222' }}
        icon={({ color, size }) => <FontAwesome name="cog" color={colorScheme === 'dark' ? '#FFA500' : '#222'} size={size} />}
        onPress={() => props.navigation.navigate('Configuración')}
      />
      <DrawerItem
        label="Cerrar sesión"
        labelStyle={{ color: colorScheme === 'dark' ? '#FFA500' : '#222' }}
        icon={({ color, size }) => <FontAwesome name="sign-out" color={colorScheme === 'dark' ? '#FFA500' : '#222'} size={size} />}
        onPress={() => {
          auth.signOut();
          props.navigation.replace('Login');
        }}
      />
    </DrawerContentScrollView>
  );
}

function MainTabs() {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#2d2233' : '#fff',
          borderTopWidth: 0,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: 'bold',
          marginBottom: 6,
          textAlign: 'center',
          alignSelf: 'center',
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarActiveTintColor: colorScheme === 'dark' ? '#FFC72C' : '#FFA500',
        tabBarInactiveTintColor: '#aaa',
      })}
    >
      <Tab.Screen
        name="Menú"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Menú',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="bars" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Mapa"
        component={MapScreen}
        options={{
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Pass"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Suscripción',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.passTabIcon}>
              <FontAwesome name="credit-card" size={size} color={color} />
              <Text style={{
                color,
                fontSize: 11,
                fontWeight: 'bold',
                marginTop: 2,
                textAlign: 'center',
                alignSelf: 'center'
              }}>Pass</Text>
            </View>
          )
        }}
      />
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
      <Drawer.Screen name="Escanear QR" component={QRScannerScreen} options={{ drawerLabel: () => null, title: null, drawerIcon: () => null, drawerItemStyle: { height: 0 } }} />
    </Drawer.Navigator>
  );
}


// Estilo de mapa oscuro
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
];

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scanAgain: {
    marginTop: 20,
    fontSize: 16,
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
    borderRadius: 16,
    padding: 24,
    minWidth: 220,
    alignItems: 'center',
    elevation: 8,
  },
  searchBarContainer: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 18,
    backgroundColor: 'transparent',
  },
  coinButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    borderRadius: 32,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  passTabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});