const { io } = require('socket.io-client');

// Conectar al Socket.IO
const socket = io('http://localhost:3000/socket', {
  auth: {
    token: 'test-token' // Token de prueba
  },
  transports: ['websocket']
});

console.log('🔌 Conectando al Socket.IO...');

// Eventos de conexión
socket.on('connect', () => {
  console.log('✅ Conectado al Socket.IO con ID:', socket.id);
  
  // Probar eventos
  console.log('\n📋 Probando eventos...');
  
  // Obtener chats del usuario
  socket.emit('connectionChats', '4');
  
  // Obtener usuarios en línea
  socket.emit('get_online_users');
  
  // Unirse a una sala de prueba
  socket.emit('join_room', 'test-room');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del Socket.IO');
});

socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión:', error.message);
});

// Eventos de mensajes
socket.on('connectionChats', (chats) => {
  console.log('💬 Chats recibidos:', JSON.stringify(chats, null, 2));
});

socket.on('online_users', (users) => {
  console.log('👥 Usuarios en línea:', users);
});

socket.on('newMessage', (message) => {
  console.log('📨 Nuevo mensaje:', message);
});

socket.on('messageDelivered', (result) => {
  console.log('✅ Mensaje entregado:', result);
});

socket.on('messageRead', (result) => {
  console.log('👁️ Mensaje leído:', result);
});

socket.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
});

// Mantener la conexión activa
setTimeout(() => {
  console.log('\n🔄 Enviando mensaje de prueba...');
  socket.emit('send_message', {
    room: 'test-room',
    message: 'Hola desde el cliente de prueba',
    user: { id: 4, name: 'Usuario Test' }
  });
}, 3000);

// Cerrar después de 10 segundos
setTimeout(() => {
  console.log('\n🔚 Cerrando conexión...');
  socket.disconnect();
  process.exit(0);
}, 10000);
