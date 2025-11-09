# 📋 Endpoints de Notificaciones - URLs Correctas

## 🔗 Endpoints Disponibles

### 1. **Crear Notificación**
```
POST /notification/create
```
**Body:**
```json
{
  "user_id": 1,
  "from_user_id": 2,
  "type": "proposal_received",
  "title": "Nueva propuesta recibida",
  "message": "Has recibido una nueva propuesta",
  "is_read": false,
  "proposal_id": 1
}
```

---

### 2. **Obtener Notificaciones por Usuario**
```
GET /notification/get-notifications-by-user/:userId
```
**Ejemplo:**
```
GET /notification/get-notifications-by-user/1
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Notificaciones obtenidas exitosamente",
  "data": {
    "notifications": [...],
    "unreadCount": 5,
    "total": 10
  }
}
```

---

### 3. **Marcar Notificación como Leída** ⭐
```
PATCH /notification/mark-as-read/:id
```
**Ejemplo:**
```
PATCH /notification/mark-as-read/1
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Notificación marcada como leída exitosamente",
  "data": {
    "id": 1,
    "is_read": true,
    "read_at": "2025-11-09T01:00:00.000Z",
    ...
  }
}
```

---

### 4. **Marcar Todas las Notificaciones como Leídas**
```
PATCH /notification/mark-all-as-read/:userId
```
**Ejemplo:**
```
PATCH /notification/mark-all-as-read/1
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Todas las notificaciones marcadas como leídas exitosamente",
  "data": {
    "count": 5,
    "userId": 1
  }
}
```

---

### 5. **Obtener Notificación por ID**
```
GET /notification/:id
```
**Ejemplo:**
```
GET /notification/1
```

---

### 6. **Actualizar Notificación (Genérico)**
```
PATCH /notification/:id
```
**Body:**
```json
{
  "is_read": true,
  "read_at": "2025-11-09T01:00:00.000Z"
}
```

---

### 7. **Eliminar Notificación**
```
DELETE /notification/:id
```
**Ejemplo:**
```
DELETE /notification/1
```

---

## ⚠️ IMPORTANTE - URL Correcta para Marcar como Leída

**La URL correcta es:**
```
PATCH /notification/mark-as-read/:id
```

**NO usar:**
- ❌ `PATCH /notification/:id` (genérico, requiere body)
- ❌ `PATCH /notification/mark-as-read/:id/read` (incorrecto)
- ❌ `PUT /notification/mark-as-read/:id` (método incorrecto)

**Ejemplo correcto en el frontend:**
```typescript
// ✅ CORRECTO
await axios.patch(`${API_BASE_URL}/notification/mark-as-read/${notificationId}`);

// ❌ INCORRECTO (requiere body)
await axios.patch(`${API_BASE_URL}/notification/${notificationId}`, { is_read: true });
```

---

## 📝 Ejemplo de Implementación en Frontend

```typescript
// APIS.ts
export class APIs {
  static async markAsReadNotification(notificationId: number) {
    return axios.patch(
      `${API_BASE_URL}/notification/mark-as-read/${notificationId}`
    );
  }

  static async markAllNotificationsAsRead(userId: number) {
    return axios.patch(
      `${API_BASE_URL}/notification/mark-all-as-read/${userId}`
    );
  }

  static async getNotificationsByUser(userId: number) {
    return axios.get(
      `${API_BASE_URL}/notification/get-notifications-by-user/${userId}`
    );
  }
}
```

---

**Última actualización:** 2025-11-09

