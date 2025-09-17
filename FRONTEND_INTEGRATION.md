# 🗺️ Integración Frontend con Google Maps

## 📋 **Cómo adaptar tu formulario actual**

### **Formulario Actual (Separado):**
```
Estado: Quintana Roo
Dirección: Av. Tulum 456
Municipio: Cancún  
Código Postal: 77500
```

### **Formulario Adaptado (Google Maps):**

#### **1. Campo de Dirección Completa**
```html
<input 
  type="text" 
  placeholder="Av. Tulum 456, Centro, 77500 Cancún, Q.R., México"
  id="address-input"
  onkeyup="getLocationSuggestions(this.value)"
/>
```

#### **2. JavaScript para Autocompletado**
```javascript
// Función para obtener sugerencias
async function getLocationSuggestions(input) {
  if (input.length < 3) return;
  
  const response = await fetch(`/user/location/suggestions?input=${encodeURIComponent(input)}`);
  const suggestions = await response.json();
  
  // Mostrar dropdown con sugerencias
  showSuggestions(suggestions);
}

// Función para seleccionar una sugerencia
function selectSuggestion(suggestion) {
  document.getElementById('address-input').value = suggestion.description;
  document.getElementById('place-id').value = suggestion.place_id;
  
  // Validar la dirección
  validateAddress(suggestion.description);
}

// Función para validar dirección
async function validateAddress(address) {
  const response = await fetch(`/user/location/validate?address=${encodeURIComponent(address)}`);
  const result = await response.json();
  
  if (result.coordinates) {
    // Guardar coordenadas para el registro
    document.getElementById('lat').value = result.coordinates.lat;
    document.getElementById('lng').value = result.coordinates.lng;
    document.getElementById('place-id').value = result.place_id;
  }
}
```

## 📤 **Datos que envía el Frontend al Backend**

### **Request Body:**
```json
{
  "first_name": "Juan",
  "first_surname": "Pérez",
  "email": "juan@example.com",
  "password": "miPassword123",
  "phone": "+52 998 765 4321",
  "type_user": "worker",
  "location": {
    "address": "Av. Tulum 456, Centro, 77500 Cancún, Q.R., México",
    "estado": "Quintana Roo",
    "municipio": "Cancún", 
    "codigo_postal": "77500"
  },
  "professions": ["Plomero"]
}
```

## 🔍 **Cómo funciona la Búsqueda**

### **1. Usuario busca profesionales:**
```json
POST /search/professionals
{
  "location": {
    "address": "Cancún, Quintana Roo",
    "radius": 10
  },
  "category": "Plomería"
}
```

### **2. Backend procesa:**
1. **Geocodifica** la dirección de búsqueda
2. **Busca** profesionales en la base de datos
3. **Calcula** distancias usando coordenadas
4. **Filtra** por radio de búsqueda
5. **Retorna** profesionales ordenados por distancia

### **3. Resultado:**
```json
{
  "professionals": [
    {
      "id": 2,
      "first_name": "María",
      "first_surname": "García", 
      "location": {
        "address": "Calle 60 #123, Centro, 97000 Mérida, Yuc., México",
        "coordinates": { "lat": 20.9674, "lng": -89.5926 }
      },
      "distance": 8.5,
      "services": ["Plomero"],
      "rating": 4.8
    }
  ],
  "total": 1,
  "search_center": {
    "address": "Cancún, Quintana Roo, México",
    "coordinates": { "lat": 21.1619, "lng": -86.8515 }
  },
  "search_radius": 10
}
```

## 🎯 **Ventajas de esta Integración**

### **✅ Para el Usuario:**
- **Autocompletado** inteligente de direcciones
- **Validación** automática de ubicaciones
- **Búsqueda precisa** por proximidad
- **Sin errores** de escritura en direcciones

### **✅ Para el Sistema:**
- **Coordenadas exactas** para cada usuario
- **Búsqueda geográfica** eficiente
- **Filtros por distancia** automáticos
- **Escalabilidad** mundial

## 🚀 **Endpoints Disponibles**

### **Registro de Usuario:**
- `POST /user/create` - Crear usuario con ubicación

### **Búsqueda:**
- `POST /search/professionals` - Buscar profesionales por ubicación
- `GET /search/locations/suggestions` - Autocompletado de ubicaciones
- `GET /search/categories` - Categorías de servicios

### **Validación Robusta:**
- `GET /user/location/suggestions` - Sugerencias de ubicación
- `GET /user/location/validate` - Validar dirección con Google Maps
- `GET /user/address/check` - **NUEVO**: Verificar dirección antes del registro

## 🛡️ **Validaciones Implementadas**

### **✅ Validaciones de Entrada:**
- **Longitud mínima**: 10 caracteres
- **Longitud máxima**: 200 caracteres
- **Caracteres válidos**: Solo letras, números, comas, puntos y guiones
- **Patrones mexicanos**: Detecta formatos como "Calle 123", "Av. 456"
- **Coordenadas geográficas**: Valida que estén dentro de México

### **🚫 Detección de Spam:**
- **Direcciones de prueba**: "test", "prueba", "ejemplo"
- **Repeticiones sospechosas**: "123 123 123"
- **Caracteres repetidos**: "aaaaaaa"
- **Coordenadas inválidas**: (0,0) o fuera de México

### **💡 Sugerencias Inteligentes:**
- **Formato mejorado**: "Calle 123, Colonia Centro, Ciudad"
- **Tipo de vía**: "Calle", "Avenida", "Boulevard"
- **Separadores**: Uso de comas para separar elementos
- **Número de casa**: Incluir número específico
- **País**: Agregar "México" al final

## 📝 **Ejemplos de Validación**

### **✅ Direcciones Válidas:**
```javascript
// Ejemplo 1: Dirección completa
GET /user/address/check?address=Calle%2060%20%23123,%20Centro,%2097000%20Mérida,%20Yuc.,%20México

// Respuesta:
{
  "isValid": true,
  "cleanAddress": "Calle 60 #123, Centro, 97000 Mérida, Yuc., México",
  "suggestions": [],
  "errors": [],
  "isSuspicious": false,
  "suspiciousReasons": []
}
```

### **❌ Direcciones Inválidas:**
```javascript
// Ejemplo 2: Dirección muy corta
GET /user/address/check?address=Cancún

// Respuesta:
{
  "isValid": false,
  "cleanAddress": "Cancún",
  "suggestions": [
    "Incluye calle, número, colonia y ciudad",
    "Considera usar formato: Calle 123, Colonia Centro, Ciudad",
    "Incluye el número de casa o edificio"
  ],
  "errors": ["La dirección debe tener al menos 10 caracteres"],
  "isSuspicious": false,
  "suspiciousReasons": []
}
```

### **🚫 Direcciones Sospechosas:**
```javascript
// Ejemplo 3: Dirección de prueba
GET /user/address/check?address=direccion%20de%20prueba%20123

// Respuesta:
{
  "isValid": false,
  "cleanAddress": "direccion de prueba 123",
  "suggestions": [],
  "errors": [],
  "isSuspicious": true,
  "suspiciousReasons": ["Dirección parece ser de prueba"]
}
```

## 🔧 **Configuración Requerida**

### **1. Variables de Entorno:**
```env
API_KEY_GOOGLE="tu-api-key-de-google-maps"
```

### **2. APIs de Google Habilitadas:**
- Places API
- Geocoding API  
- Maps JavaScript API

## 🎯 **Flujo Recomendado para Frontend**

### **1. Validación en Tiempo Real:**
```javascript
// Validar mientras el usuario escribe
async function validateAddressInput(address) {
  if (address.length < 10) return;
  
  const response = await fetch(`/user/address/check?address=${encodeURIComponent(address)}`);
  const result = await response.json();
  
  if (!result.isValid) {
    showErrors(result.errors);
    showSuggestions(result.suggestions);
  }
  
  if (result.isSuspicious) {
    showWarning(result.suspiciousReasons);
  }
}
```

### **2. Validación Final antes del Registro:**
```javascript
// Validar antes de enviar el formulario
async function validateBeforeSubmit(formData) {
  const addressCheck = await fetch(`/user/address/check?address=${encodeURIComponent(formData.address)}`);
  const addressResult = await addressCheck.json();
  
  if (!addressResult.isValid || addressResult.isSuspicious) {
    alert('Por favor, corrige la dirección antes de continuar');
    return false;
  }
  
  return true;
}
```

¡Con esta integración tendrás un sistema de ubicación profesional, seguro y a prueba de usuarios torpes! 🎉
