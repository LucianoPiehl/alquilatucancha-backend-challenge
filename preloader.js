const axios = require('axios');


const mostRequestedData = [
  { placeId: 'ChIJoYUAHyvmopUR4xJzVPBE_Lw', date: '2022-08-25' },
  { placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4', date: '2022-08-30' },
  { placeId: 'ChIJrTLr-GyuEmsRBfy61i59si0', date: '2022-09-01' },
  { placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ', date: '2022-07-20' },
];


const BASE_URL = 'http://localhost:3000/search';

/**
 * Preloader que envia solicitudes http para cargar el caché
 */
async function preloadCache() {
  console.log('🚀 Iniciando el preloader de datos...');
  const promises = mostRequestedData.map(async ({ placeId, date }) => {
    try {
      // Construye la URL con los parámetros
      const url = `${BASE_URL}?placeId=${placeId}&date=${date}`;
      console.log(`Solicitando: ${url}`);

      // Realiza la solicitud
      const response = await axios.get(url);

      // Log para confirmar la respuesta
      if (response.status === 200) {
        console.log(`✅ Cacheado correctamente: ${url}`);
      } else {
        console.warn(`⚠️ Respuesta inesperada para ${url}:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Error al precargar ${placeId} en ${date}`, error.message);
    }
  });

  try {
    await Promise.all(promises);
    console.log('🎉 ¡Precarga completada!');
  } catch (err) {
    console.error('❌ Hubo errores en el preloader:', err);
  }
}

preloadCache();