import { Controller, Get, Inject, Query } from '@nestjs/common';
import { CACHE_PORT } from './domain/ports/cache.port.provider';
import { CachePort } from './domain/ports/cache.port';
import { CommandBus } from '@nestjs/cqrs';
import { TestCacheCommand } from './domain/handlers/test-cache.handler';

@Controller()
export class AppController {
  constructor(
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/redis-set')
    async setCache(
      @Query('key') key: string,
      @Query('value') value: string,
    ): Promise<string> {
      await this.cachePort.set(key, value);
      return `Clave '${key}' guardada con éxito en Redis.`;
    }

    @Get('/redis-get')
    async getCache(@Query('key') key: string): Promise<string> {
      const value = await this.cachePort.get(key);
      return value ?? `No se encontró ningún valor para la clave '${key}'.`;
    }

    @Get('/redis-del')
    async deleteCache(@Query('key') key: string): Promise<string> {
      await this.cachePort.del(key);
      return `Clave '${key}' eliminada con éxito.`;
    }


}