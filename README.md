<h1>1. Iniciando el sistema</h1>
Para iniciar el sistema correctamente:
Levantar contenedores Docker: Abre una terminal en la raíz del proyecto y ejecuta el siguiente comando:
   docker-compose up
Cargar datos iniciales en Redis: Una vez que los contenedores estén en ejecución, en otra terminal, ejecuta:
   node preloader.js

<h1>2. Cambios realizados</h1>
Con el objetivo de mejorar el rendimiento de las consultas a los endpoints y reducir el número de llamadas repetitivas hacia las APIs externas, se realizaron las siguientes implementaciones:
<h2>a) Sistema de caché utilizando Redis:</h2>
El sistema de caché guarda las consultas previamente realizadas para ahorrar tiempo en consultas repetitivas.
La clave del caché tiene el formato: availability:{placeId}:{date} Por ejemplo: availability:12345:2023-12-07.
Los valores almacenados corresponden a los resultados en formato JSON de las consultas realizadas, que incluyen información sobre clubes, canchas, y sus horarios disponibles.

<h2>b) Sistema de preloader:</h2>
Se agregó un archivo preloader.js que se debe ejecutar al iniciar el sistema. Este archivo precarga información clave en el caché para responder de manera inmediata incluso a la primera consulta.

Para mantener la arquitectura hexagonal, se implementaron cambios siguiendo este patrón:
CachePort: Es una interfaz definida en el directorio domain/ports. Permite que el código del dominio interactúe con Redis sin romper el principio de independencia.
cache.port.provider.ts: Proporciona un token de la interfaz CachePort.
RedisCacheService: La implementación concreta del CachePort utiliza Redis, y está ubicada en el módulo de infrastructure>cache.


La api principal, Redis y mock ahora son parte de los servicios levantados por Docker y está configurado en la misma red que los demás componentes del sistema (app-network), esto facilita el arranque del sistema y la comunicacion entre los componentes.
Puedes revisar estos cambios en el archivo docker-compose.yml. 



<h1>3. Trabajo pendiente</h1>

<h2>a) Limpieza automática del caché:</h2>
Actualmente, los datos en el caché no tienen un tiempo de expiración, lo cual puede generar un uso excesivo de memoria.
Existe un método en CachePort que permite limpiar todo el caché manualmente, pero no se ha implementado un mecanismo automatizado (como un cron job) para ejecutarlo periódicamente. 

<h2>b) Manejo de actualizaciones en el caché:</h2>
Las actualizaciones dinámicas en las entradas del caché no están configuradas actualmente.
Propuesta:
Sobrescribir los datos del caché basándose en eventos recibidos.
Evitar el abuso de solicitudes hacia la API actuando exclusivamente sobre los datos que ya están en el caché.

<h2>c) Preloader dinámico:</h2>
Actualmente, el script preloader.js usa valores hardcodeados (placeId y date) para cargar información en el caché.
Lo que queda es hacer el script dinámico, obteniendo dinámicamente los placeId que tienen más consultas históricas o basándose en patrones de uso.

<h1>4. Archivos de utilidades:</h1>
Algunos archivos fueron usados para comprobar que los caches se almacenaban y interactuaban bien con el sistema de forma manual, como por ejemplo app.controller.ts , el unico fin de ese archivo es comprobar que los caches funcionan. Via navegador.
Por ejemplo
<h3>http://localhost:3000/redis-set?key=test-key&value=HolaCaché <br><br> (Se espera que salga mensaje de confirmacion de guardado) </h3><br>
<h3>http://localhost:3000/redis-get?key=test-key <br><br> (Se espera "HolaCaché")</h3><br>
<h3>http://localhost:3000/redis-clear <br><br> (Se espera mensaje de confirmacion)</h3><br>
<h3>http://localhost:3000/redis-get?key=test-key <br><br> (Se espera mensaje de que no hay dato disponible para test-key)</h3><br>

<h1>5. Métricas de rendimiento</h1>
Antes de implementar este sistema, las consultas al endpoint principal tenían un rendimiento muy bajo:
<h3>Endpoint evaluado: GET http://localhost:3000/search</h3>
<h3>Datos de prueba: </h3>
<h3>placeId:ChIJoYUAHyvmopUR4xJzVPBE_Lw</h3>
<h3>date:2022-08-25</h3>
<h3>URL:http://localhost:3000/search?placeId=ChIJoYUAHyvmopUR4xJzVPBE_Lw&date=2022-08-25</h3>

<h3>Tiempos de respuesta antes: 18 segundos por consulta.</h3><br>
<h3>Tiempos de respuesta después: 20ms aproximado por consulta.</h3>



