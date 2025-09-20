// Script que usa la misma configuración que tu frontend
const { io } = require('socket.io-client');

console.log('🔌 Probando con configuración del frontend...');

// Usar la misma configuración que tu frontend
const socket = io("http://localhost:3000", {
    path: "/socket.io",
});

// Eventos de conexión
socket.on('connect', () => {
  console.log('✅ CONECTADO con configuración del frontend. ID:', socket.id);
  
  // Probar eventos después de conectar
  setTimeout(() => {
    console.log('📋 Enviando evento get-chats-user...');
    socket.emit('get-chats-user', { userId: '4' });
  }, 1000);
  
  setTimeout(() => {
    console.log('💬 Enviando evento connectionChats...');
    socket.emit('connectionChats', '4');
  }, 2000);
});

socket.on('disconnect', (reason) => {
  console.log('❌ DESCONECTADO. Razón:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ ERROR de conexión:', error.message);
});

// Escuchar eventos
socket.on('get-chats-user', (data) => {
  console.log('💬 RESPUESTA get-chats-user:', JSON.stringify(data, null, 2));
});

socket.on('connectionChats', (data) => {
  console.log('💬 RESPUESTA connectionChats:', JSON.stringify(data, null, 2));
});

socket.on('connected', (data) => {
  console.log('🎉 EVENTO connected:', JSON.stringify(data, null, 2));
});

socket.on('error', (error) => {
  console.error('❌ ERROR del servidor:', JSON.stringify(error, null, 2));
});

// Mantener la conexión activa
setTimeout(() => {
  console.log('🔚 Cerrando conexión...');
  socket.disconnect();
  process.exit(0);
}, 10000);
