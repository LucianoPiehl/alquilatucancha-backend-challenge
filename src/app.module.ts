import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ClubUpdatedHandler } from './domain/handlers/club-updated.handler';
import { GetAvailabilityHandler } from './domain/handlers/get-availability.handler';
import { ALQUILA_TU_CANCHA_CLIENT } from './domain/ports/aquila-tu-cancha.client';
import { HTTPAlquilaTuCanchaClient } from './infrastructure/clients/http-alquila-tu-cancha.client';
import { EventsController } from './infrastructure/controllers/events.controller';
import { SearchController } from './infrastructure/controllers/search.controller';
import { RedisCacheService } from './infrastructure/cache/redis-cache.service';
import { AppController } from './app.controller';
import { CachePort } from './domain/ports/cache.port';
import { CACHE_PORT } from './domain/ports/cache.port.provider';
import { TestCacheHandler } from './domain/handlers/test-cache.handler';

@Module({
  imports: [HttpModule, CqrsModule, ConfigModule.forRoot()],
  controllers: [AppController, SearchController, EventsController],
  providers: [
    {
      provide: ALQUILA_TU_CANCHA_CLIENT,
      useClass: HTTPAlquilaTuCanchaClient,
    },
    GetAvailabilityHandler,
    ClubUpdatedHandler,

    {
      // Asociación de CachePort a RedisCacheService
     provide: CACHE_PORT,
      useClass: RedisCacheService,
    },
   TestCacheHandler,
  ],
  exports: [
   CACHE_PORT,
  ],
})
export class AppModule {}