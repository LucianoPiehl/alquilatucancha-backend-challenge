import * as moment from 'moment';

import { AlquilaTuCanchaClient } from '../../domain/ports/aquila-tu-cancha.client';
import { GetAvailabilityQuery } from '../commands/get-availaiblity.query';
import { Club } from '../model/club';
import { Court } from '../model/court';
import { Slot } from '../model/slot';
import { GetAvailabilityHandler } from './get-availability.handler';
import { CachePort } from '../ports/cache.port';

describe('GetAvailabilityHandler', () => {
  let handler: GetAvailabilityHandler;
  let client: FakeAlquilaTuCanchaClient;
  let cachePort: CachePort;

  beforeEach(() => {
    client = new FakeAlquilaTuCanchaClient();

    cachePort = {
      get: jest.fn(),
      set: jest.fn(),
    };

    handler = new GetAvailabilityHandler(client, cachePort);
  });

  it('returns the availability and caches the data', async () => {
    client.clubs = {
      '123': [{ id: 1 }],
    };
    client.courts = {
      '1': [{ id: 1 }],
    };
    client.slots = {
      '1_1_2022-12-05': [],
    };
    const placeId = '123';
    const date = moment('2022-12-05').toDate();
    const cacheKey = `availability:${placeId}:2022-12-05`;


    (cachePort.get as jest.Mock).mockResolvedValueOnce(null);

    const startTimeWithoutCache = Date.now();
    const response = await handler.execute(
      new GetAvailabilityQuery(placeId, date),
    );
    const endTimeWithoutCache = Date.now();

    expect(response).toEqual([{ id: 1, courts: [{ id: 1, available: [] }] }]);

    expect(cachePort.get).toHaveBeenCalledWith(cacheKey);
    expect(cachePort.set).toHaveBeenCalledWith(
      cacheKey,
      JSON.stringify([{ id: 1, courts: [{ id: 1, available: [] }] }]),
    );

    console.log(
      `Tiempo de ejecución sin usar caché: ${
        endTimeWithoutCache - startTimeWithoutCache
      }ms`,
    );

    (cachePort.get as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([{ id: 1, courts: [{ id: 1, available: [] }] }]),
    );

    const startTimeWithCache = Date.now();
    const cachedResponse = await handler.execute(
      new GetAvailabilityQuery(placeId, date),
    );
    const endTimeWithCache = Date.now();

    expect(cachedResponse).toEqual(response);
    expect(cachePort.get).toHaveBeenCalledWith(cacheKey);
    expect(cachePort.set).toHaveBeenCalledTimes(1);

    console.log(
      `Tiempo de ejecución usando caché: ${
        endTimeWithCache - startTimeWithCache
      }ms`,
    );
  });
});


class FakeAlquilaTuCanchaClient implements AlquilaTuCanchaClient {
  clubs: Record<string, Club[]> = {};
  courts: Record<string, Court[]> = {};
  slots: Record<string, Slot[]> = {};
  async getClubs(placeId: string): Promise<Club[]> {
    return this.clubs[placeId];
  }
  async getCourts(clubId: number): Promise<Court[]> {
    return this.courts[String(clubId)];
  }
  async getAvailableSlots(
    clubId: number,
    courtId: number,
    date: Date,
  ): Promise<Slot[]> {
    return this.slots[
      `${clubId}_${courtId}_${moment(date).format('YYYY-MM-DD')}`
    ];
  }
}