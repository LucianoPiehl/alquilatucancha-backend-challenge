import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ClubWithAvailability,
  GetAvailabilityQuery,
} from '../commands/get-availaiblity.query';
import {
  ALQUILA_TU_CANCHA_CLIENT,
  AlquilaTuCanchaClient,
} from '../ports/aquila-tu-cancha.client';
import { CACHE_PORT } from '../ports/cache.port.provider'; // Token para identificar el puerto
import { CachePort } from '../ports/cache.port'; // Interfaz del puerto

@QueryHandler(GetAvailabilityQuery)
export class GetAvailabilityHandler
  implements IQueryHandler<GetAvailabilityQuery>
{
  constructor(
    @Inject(ALQUILA_TU_CANCHA_CLIENT)
    private alquilaTuCanchaClient: AlquilaTuCanchaClient,

    @Inject(CACHE_PORT) private cachePort: CachePort, // Inyección del puerto de caché
  ) {}

  async execute(query: GetAvailabilityQuery): Promise<ClubWithAvailability[]> {
    const cacheKey = `availability:${query.placeId}:${query.date}`; // Generamos una clave única para esta consulta

    // 1. Intentamos obtener los datos desde el caché
    const cachedData = await this.cachePort.get(cacheKey); // Utilizamos el puerto de caché
    if (cachedData) {
      console.log(`Datos obtenidos desde el caché -> ${cacheKey}`);
      return JSON.parse(cachedData) as ClubWithAvailability[]; // Convertimos el string del caché a JSON
    }

    // 2. Si no hay datos en el caché, ejecutamos la lógica normal
    const clubs_with_availability: ClubWithAvailability[] = [];
    const clubs = await this.alquilaTuCanchaClient.getClubs(query.placeId);

    for (const club of clubs) {
      const courts = await this.alquilaTuCanchaClient.getCourts(club.id);
      const courts_with_availability: ClubWithAvailability['courts'] = [];
      for (const court of courts) {
        const slots = await this.alquilaTuCanchaClient.getAvailableSlots(
          club.id,
          court.id,
          query.date,
        );
        courts_with_availability.push({
          ...court,
          available: slots,
        });
      }
      clubs_with_availability.push({
        ...club,
        courts: courts_with_availability,
      });
    }

    // 3. Guardamos los datos en el caché para futuras solicitudes
    console.log(`Guardando los datos en el caché -> ${cacheKey}`);
    await this.cachePort.set(cacheKey, JSON.stringify(clubs_with_availability)); // Guardamos los datos como string

    // 4. Retornamos los datos generados
    return clubs_with_availability;
  }
}