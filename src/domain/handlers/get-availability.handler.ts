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
import { CACHE_PORT } from '../ports/cache.port.provider';
import { CachePort } from '../ports/cache.port';

@QueryHandler(GetAvailabilityQuery)
export class GetAvailabilityHandler
  implements IQueryHandler<GetAvailabilityQuery>
{
  constructor(
    @Inject(ALQUILA_TU_CANCHA_CLIENT)
    private alquilaTuCanchaClient: AlquilaTuCanchaClient,

    @Inject(CACHE_PORT) private cachePort: CachePort,
  ) {}

  async execute(query: GetAvailabilityQuery): Promise<ClubWithAvailability[]> {
    const cacheKey = `availability:${query.placeId}:${query.date}`;


    const cachedData = await this.cachePort.get(cacheKey);
    if (cachedData) {
      console.log(`Datos obtenidos desde el caché -> ${cacheKey}`);
      return JSON.parse(cachedData) as ClubWithAvailability[];
    }

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


    console.log(`Guardando los datos en el caché -> ${cacheKey}`);
    await this.cachePort.set(cacheKey, JSON.stringify(clubs_with_availability));

    return clubs_with_availability;
  }
}