// Script para decodificar el JWT manualmente
const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjgsImVtYWlsIjoiTHVpc0BnbWFpbC5jb20iLCJ0eXBlX3VzZXIiOiJ3b3JrZXIiLCJpYXQiOjE3NTgzMTE0NDEsImV4cCI6MTc1ODM5Nzg0MX0.LbSQtbeOC2zGm56YWjLCrPUBJtyzbh50tVXMMwZoa-w';

console.log('🔍 Decodificando JWT...');

try {
  // Decodificar sin verificar primero
  const decoded = jwt.decode(token);
  console.log('📋 JWT decodificado (sin verificar):', JSON.stringify(decoded, null, 2));
  
  // Verificar con diferentes secrets
  const secrets = [
    'tu-secreto-super-secreto',
    'tu-secret-key',
    process.env.JWT_SECRET
  ];
  
  secrets.forEach((secret, index) => {
    try {
      const verified = jwt.verify(token, secret);
      console.log(`✅ JWT verificado con secret ${index + 1} (${secret}):`, JSON.stringify(verified, null, 2));
    } catch (error) {
      console.log(`❌ Error con secret ${index + 1} (${secret}):`, error.message);
    }
  });
  
} catch (error) {
  console.error('❌ Error decodificando JWT:', error.message);
}
