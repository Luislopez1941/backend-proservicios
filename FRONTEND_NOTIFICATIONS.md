# 📬 Documentación Frontend - Sistema de Notificaciones en Tiempo Real

## 📋 Resumen

Este documento describe cómo el frontend debe implementar el sistema de notificaciones en tiempo real usando Socket.IO. Las notificaciones se emiten automáticamente cuando un usuario recibe un mensaje.

---

## 🔌 Eventos de Socket

### Eventos que el Frontend ESCUCHA (Backend EMITE)

#### 1. `notifications-updated` ⭐ EVENTO PRINCIPAL

**Cuándo se emite:**
- Cuando un usuario recibe un nuevo mensaje
- Cuando se obtienen los chats (`get-chats-user`)
- El backend crea automáticamente una notificación y emite este evento

**⚠️ IMPORTANTE:** Este evento se usa para:
- **Header/Badge**: Solo necesita `unreadCount` y `unreadMessagesCount` para mostrar los números
- **Pantalla de Notificaciones**: Necesita `notifications` (array completo) para mostrar la lista

**Ambos casos escuchan el mismo evento, pero usan diferentes partes del payload.**

**Payload:**
```typescript
{
  success: true,
  data: {
    notifications: [
      {
        id: number,
        user_id: number,
        from_user_id: number | null,
        type: NotificationType,
        title: string,
        message: string,
        is_read: boolean,
        read_at: string | null,
        job_id: number | null,
        proposal_id: number | null,
        metadata: {
          chat_id: number,
          message_id: number,
          issuer_id: number,
          receiver_id: number
        } | null,
        created_at: string,
        updated_at: string,
        fromUser: {
          id: number,
          first_name: string,
          first_surname: string,
          email: string,
          profilePhoto: string | null
        } | null,
        job: {
          id: number,
          title: string,
          status: string
        } | null,
        proposal: {
          id: number,
          title: string,
          status: string
        } | null
      }
    ],
    unreadCount: number,              // Notificaciones no leídas (para badge de notificaciones)
    total: number,                     // Total de notificaciones
    unreadMessagesCount: number       // Mensajes de chat no leídos (para badge de mensajes) ⭐
  }
}
```

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "user_id": 2,
        "from_user_id": 1,
        "type": "message_received",
        "title": "Nuevo mensaje recibido",
        "message": "Hola, ¿cómo estás?",
        "is_read": false,
        "read_at": null,
        "job_id": null,
        "proposal_id": null,
        "metadata": {
          "chat_id": 1,
          "message_id": 123,
          "issuer_id": 1,
          "receiver_id": 2
        },
        "created_at": "2025-11-09T01:00:00.000Z",
        "updated_at": "2025-11-09T01:00:00.000Z",
        "fromUser": {
          "id": 1,
          "first_name": "Luis",
          "first_surname": "Lopez",
          "email": "luis@example.com",
          "profilePhoto": "https://..."
        },
        "job": null,
        "proposal": null
      }
    ],
    "unreadCount": 5,              // Notificaciones no leídas
    "total": 10,                   // Total de notificaciones
    "unreadMessagesCount": 3      // Mensajes de chat no leídos ⭐
  }
}
```

---

#### 2. `unread-count`

**Cuándo se emite:**
- Cuando se envía un mensaje
- Cuando se marca un mensaje como leído
- Al conectar el socket
- Al obtener la lista de chats

**Payload:**
```typescript
{
  total: number,
  userId: number,
  timestamp: string
}
```

**Ejemplo:**
```json
{
  "total": 5,
  "userId": 2,
  "timestamp": "2025-11-09T01:00:00.000Z"
}
```

---

## 📤 Eventos que el Frontend EMITE (Backend ESCUCHA)

### 1. `send-message`

**Cuándo emitir:**
- Cuando el usuario envía un mensaje

**Payload:**
```typescript
{
  room: string,
  message: string,
  type?: string,
  issuer_id: number,
  receiver_id: number,
  chat_id: number
}
```

**Ejemplo:**
```typescript
socket.emit('send-message', {
  room: 'chat_1',
  message: 'Hola, ¿cómo estás?',
  type: 'normal',
  issuer_id: 1,
  receiver_id: 2,
  chat_id: 1
});
```

**Respuesta del backend:**
- Emite `notifications-updated` al receptor automáticamente
- Emite `unread-count` a ambos usuarios

---

## 🏗️ Estructura de Implementación Frontend

### 1. Store/State Management (Zustand/Redux/Context)

```typescript
// storeNotifications.ts (Zustand)
import { create } from 'zustand';

interface Notification {
  id: number;
  user_id: number;
  from_user_id: number | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  job_id: number | null;
  proposal_id: number | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  fromUser?: {
    id: number;
    first_name: string;
    first_surname: string;
    email: string;
    profilePhoto: string | null;
  } | null;
  job?: any;
  proposal?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;              // Notificaciones no leídas
  unreadMessagesCount: number;      // Mensajes de chat no leídos ⭐
  total: number;
  isLoading: boolean;
  
  // Actions
  setNotifications: (data: {
    notifications: Notification[];
    unreadCount: number;
    unreadMessagesCount: number;    // ⭐ NUEVO
    total: number;
  }) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  unreadMessagesCount: 0,        // ⭐ NUEVO
  total: 0,
  isLoading: false,

  setNotifications: (data) => set({
    notifications: data.notifications,
    unreadCount: data.unreadCount,
    unreadMessagesCount: data.unreadMessagesCount || 0,  // ⭐ NUEVO
    total: data.total,
  }),

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
    total: state.total + 1,
  })),

  markAsRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({
      ...n,
      is_read: true,
      read_at: n.read_at || new Date().toISOString(),
    })),
    unreadCount: 0,
  })),

  clearNotifications: () => set({
    notifications: [],
    unreadCount: 0,
    total: 0,
  }),
}));
```

---

### 2. Hook para Socket de Notificaciones

```typescript
// useNotificationsSocket.ts
import { useEffect } from 'react';
import { getSocket } from '@/components/socket';
import { useNotificationStore } from '@/zustand/storeNotifications';

export const useNotificationsSocket = () => {
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket) {
      console.warn('Socket no disponible');
      return;
    }

    // Escuchar actualizaciones de notificaciones
    const handleNotificationsUpdated = (data: any) => {
      console.log('📬 Notificaciones actualizadas recibidas:', data);
      
      if (data.success && data.data) {
        // Actualizar todas las notificaciones (incluye conteo de mensajes)
        setNotifications({
          notifications: data.data.notifications || [],
          unreadCount: data.data.unreadCount || 0,
          unreadMessagesCount: data.data.unreadMessagesCount || 0,  // ⭐ NUEVO
          total: data.data.total || 0,
        });
      }
    };

    // Escuchar conteo de no leídos
    const handleUnreadCount = (data: any) => {
      console.log('📊 Conteo de no leídos:', data);
      
      if (data.total !== undefined) {
        // Actualizar solo el conteo si es necesario
        useNotificationStore.setState({ unreadCount: data.total });
      }
    };

    // Registrar listeners
    socket.on('notifications-updated', handleNotificationsUpdated);
    socket.on('unread-count', handleUnreadCount);

    // Cleanup
    return () => {
      socket.off('notifications-updated', handleNotificationsUpdated);
      socket.off('unread-count', handleUnreadCount);
    };
  }, [setNotifications, addNotification]);
};
```

---

### 3. Componente de Header con Badge de Notificaciones

**Este componente solo necesita los conteos, NO la lista completa de notificaciones.**

```typescript
// NotificationBadge.tsx
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '@/zustand/storeNotifications';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';

export const NotificationBadge: React.FC = () => {
  // Inicializar socket de notificaciones
  useNotificationsSocket();
  
  // Solo necesitamos los conteos para el badge
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const unreadMessagesCount = useNotificationStore((state) => state.unreadMessagesCount);
  
  // Total de no leídos (notificaciones + mensajes)
  const totalUnread = unreadCount + unreadMessagesCount;

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => {
        // Navegar a la pantalla de notificaciones
        // router.push('/notifications');
      }}
    >
      <Ionicons name="notifications-outline" size={24} color="#3f7dc0" />
      {totalUnread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

---

### 4. Pantalla de Notificaciones

```typescript
// NotificationsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNotificationStore } from '@/zustand/storeNotifications';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';
import { APIs } from '@/pages/services/APIS';
import { Ionicons } from '@expo/vector-icons';

export const NotificationsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Inicializar socket
  useNotificationsSocket();
  
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  // Cargar notificaciones iniciales
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Obtener ID del usuario desde el store de usuario
      const userId = useUserStore.getState().user?.id;
      
      if (!userId) {
        console.error('Usuario no autenticado');
        return;
      }

      const response = await APIs.getNotificationsByUser(userId);
      
      if (response.data && response.data.data) {
        setNotifications({
          notifications: response.data.data.notifications || [],
          unreadCount: response.data.data.unreadCount || 0,
          total: response.data.data.total || 0,
        });
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      // Actualizar en el backend
      await APIs.markNotificationAsRead(notificationId);
      
      // Actualizar en el store
      markAsRead(notificationId);
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Actualizar todas en el backend
      // await APIs.markAllNotificationsAsRead();
      
      // Actualizar en el store
      markAllAsRead();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message_received':
        return 'chatbubble-outline';
      case 'proposal_received':
        return 'document-text-outline';
      case 'job_assigned':
        return 'briefcase-outline';
      case 'reservation_created':
        return 'calendar-outline';
      default:
        return 'notifications-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f7dc0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllRead}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notificationItem,
              !item.is_read && styles.unreadNotification
            ]}
            onPress={() => handleMarkAsRead(item.id)}
          >
            <View style={styles.notificationContent}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getNotificationIcon(item.type)}
                  size={24}
                  color={item.is_read ? '#999' : '#3f7dc0'}
                />
                {!item.is_read && <View style={styles.unreadDot} />}
              </View>
              
              <View style={styles.textContainer}>
                <Text style={[
                  styles.title,
                  !item.is_read && styles.unreadTitle
                ]}>
                  {item.title}
                </Text>
                <Text style={styles.message} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.time}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No hay notificaciones</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  markAllRead: {
    color: '#3f7dc0',
    fontSize: 14,
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3f7dc0',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
```

---

### 5. API Service

```typescript
// APIS.ts o notification.service.ts
export class APIs {
  // ... otros métodos

  static async getNotificationsByUser(userId: number) {
    return axios.get(`${API_BASE_URL}/notification/get-notifications-by-user/${userId}`);
  }

  static async markNotificationAsRead(notificationId: number) {
    return axios.patch(`${API_BASE_URL}/notification/${notificationId}`, {
      is_read: true,
      read_at: new Date().toISOString(),
    });
  }

  static async markAllNotificationsAsRead(userId: number) {
    // Implementar si existe este endpoint
    // return axios.patch(`${API_BASE_URL}/notification/mark-all-read/${userId}`);
  }
}
```

---

## 🔄 Flujo Completo

### 1. Usuario A envía mensaje a Usuario B

```typescript
// Usuario A (Emisor)
socket.emit('send-message', {
  room: 'chat_1',
  message: 'Hola!',
  type: 'normal',
  issuer_id: 1,
  receiver_id: 2,
  chat_id: 1
});
```

### 2. Backend procesa y crea notificación

- Guarda el mensaje
- Crea notificación para Usuario B
- Calcula mensajes no leídos
- Emite `notifications-updated` a Usuario B con TODO incluido

### 3. Usuario B recibe notificación en tiempo real

```typescript
// Usuario B (Receptor) - Automático
socket.on('notifications-updated', (data) => {
  // data.data contiene:
  // - notifications: array completo (para pantalla de notificaciones)
  // - unreadCount: número (notificaciones no leídas - para badge)
  // - unreadMessagesCount: número (mensajes no leídos - para badge) ⭐
  // - total: número
  
  // Actualizar store
  setNotifications(data.data);
  
  // HEADER: Solo usa unreadCount + unreadMessagesCount para badges
  // PANTALLA: Usa notifications para mostrar lista completa
});
```

### 4. Uso en diferentes componentes

**Header/Badge (solo conteos):**
```typescript
const unreadCount = useNotificationStore((state) => state.unreadCount);
const unreadMessagesCount = useNotificationStore((state) => state.unreadMessagesCount);
const totalBadge = unreadCount + unreadMessagesCount; // Sumar ambos
```

**Pantalla de Notificaciones (lista completa):**
```typescript
const notifications = useNotificationStore((state) => state.notifications);
// Muestra la lista completa de notificaciones
```

---

## 📱 Ejemplo de Integración en App Principal

```typescript
// App.tsx o _layout.tsx
import { useEffect } from 'react';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';
import { NotificationBadge } from '@/components/NotificationBadge';

export default function App() {
  // Inicializar socket de notificaciones globalmente
  useNotificationsSocket();

  return (
    // ... tu app
    <NotificationBadge />
  );
}
```

---

## ✅ Checklist de Implementación

- [ ] Crear store de notificaciones (Zustand/Redux/Context)
- [ ] Crear hook `useNotificationsSocket`
- [ ] Crear componente `NotificationBadge` para el header
- [ ] Crear pantalla `NotificationsScreen`
- [ ] Agregar métodos en API service
- [ ] Integrar en el componente principal de la app
- [ ] Probar envío de mensajes y recepción de notificaciones
- [ ] Implementar marcar como leída
- [ ] Implementar navegación desde notificación al chat/trabajo

---

## 🎯 Tipos de Notificaciones Disponibles

```typescript
enum NotificationType {
  proposal_received      // Propuesta recibida
  proposal_accepted      // Propuesta aceptada
  proposal_rejected      // Propuesta rechazada
  proposal_cancelled     // Propuesta cancelada
  job_assigned          // Trabajo asignado
  job_completed         // Trabajo completado
  job_cancelled         // Trabajo cancelado
  message_received      // Mensaje recibido ⭐ (el que implementamos)
  reservation_created   // Reservación creada
  reservation_confirmed // Reservación confirmada
  reservation_cancelled // Reservación cancelada
  review_received       // Reseña recibida
  payment_received      // Pago recibido
  payment_failed        // Pago fallido
  system                // Notificación del sistema
}
```

---

**Última actualización:** 2025-11-09

