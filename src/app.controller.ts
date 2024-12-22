import { Controller, Get, Inject, Query } from '@nestjs/common';
import { CACHE_PORT } from './domain/ports/cache.port.provider';
import { CachePort } from './domain/ports/cache.port';
import { CommandBus } from '@nestjs/cqrs';
import { TestCacheCommand } from './domain/handlers/test-cache.handler';

@Controller()
export class AppController {
  constructor(
    @Inject(CACHE_PORT) private readonly cachePort: CachePort, // Inyectamos el puerto
    private readonly commandBus: CommandBus, // Inyectamos CommandBus para ejecutar comandos
  ) {}

  @Get('/redis-test')
  async testRedis(): Promise<string> {
    const value = await this.cachePort.get('test-key');
    return value ?? 'Valor no encontrado';
  }

  @Get('/cache-handler-test')
  async testHandler(@Query('key') key: string): Promise<string> {
    // Ejecutamos un comando para procesar `TestCacheCommand`
    const result = await this.commandBus.execute(new TestCacheCommand(key));
    return result;
  }
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

    @Get('/redis-clear')
    async clearAllCache(): Promise<string> {
      // Limpiamos todas las claves en caché
      const keys = await (this.cachePort as any).client.keys('*'); // Obtenemos todas las claves
      const pipeline = keys.map((key: string) => this.cachePort.del(key)); // Borramos cada una
      await Promise.all(pipeline); // Ejecutamos todas las operaciones en paralelo
      return `Todos los datos en el caché han sido eliminados manualmente.`;
    }
}