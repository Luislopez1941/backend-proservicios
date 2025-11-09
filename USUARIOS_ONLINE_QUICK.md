# Implementación Rápida - Usuarios Online

## 1. Escuchar eventos en el Socket

```typescript
// En tu servicio de socket o donde configures los listeners

socket.on('user-online', (data) => {
  // data: { user_id: number, is_online: true, timestamp: string }
  console.log('Usuario online:', data.user_id);
  // Actualizar estado: setOtherUserOnline(true) si data.user_id === otherUserId
});

socket.on('user-offline', (data) => {
  // data: { user_id: number, is_online: false, timestamp: string }
  console.log('Usuario offline:', data.user_id);
  // Actualizar estado: setOtherUserOnline(false) si data.user_id === otherUserId
});

// Evento adicional para actualizar la lista cuando cambia el estado
socket.on('user-status-changed', (data) => {
  // data: { user_id: number, is_online: boolean, timestamp: string }
  // Este evento se envía a todos los usuarios cuando alguien se conecta/desconecta
  // Puedes usarlo para actualizar la lista de usuarios online automáticamente
  if (data.user_id === otherUserId) {
    setOtherUserOnline(data.is_online);
  }
  // Opcional: refrescar la lista completa
  // socket.emit('get_online_users');
});

socket.on('online_users', (userIds: number[]) => {
  // userIds: [1, 2, 3, 4] - Array de IDs de usuarios online
  console.log('Usuarios online:', userIds);
  // Verificar si otherUserId está en el array
  const isOnline = userIds.includes(otherUserId);
  setOtherUserOnline(isOnline);
});
```

## 2. Solicitar usuarios online al conectar

```typescript
// Cuando el socket se conecta exitosamente
socket.on('connected', () => {
  // Solicitar lista de usuarios online
  socket.emit('get_online_users');
});
```

## 3. Verificar si un usuario está online

```typescript
// Función helper
const isUserOnline = (userId: number, onlineUsers: number[]): boolean => {
  return onlineUsers.includes(userId);
};

// Uso
const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
const otherUserId = 2; // ID del otro usuario

const isOnline = isUserOnline(otherUserId, onlineUsers);
```

## Resumen de Eventos

**Emitir:**
```typescript
socket.emit('get_online_users');
```

**Escuchar:**
```typescript
socket.on('online_users', (userIds: number[]) => {
  // userIds = [1, 2, 3, 4]
  setOnlineUsers(userIds);
});

socket.on('user-online', (data) => {
  // data = { user_id: 2, is_online: true, timestamp: "..." }
  if (data.user_id === otherUserId) {
    setOtherUserOnline(true);
  }
});

socket.on('user-offline', (data) => {
  // data = { user_id: 2, is_online: false, timestamp: "..." }
  if (data.user_id === otherUserId) {
    setOtherUserOnline(false);
  }
});
```

