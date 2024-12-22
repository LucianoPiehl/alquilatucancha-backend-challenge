import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CachePort } from '../ports/cache.port';
import { CACHE_PORT } from '../ports/cache.port.provider';

// Definimos un comando genérico (puedes adaptarlo a tu caso)
export class TestCacheCommand {
  constructor(public readonly key: string) {}
}

@CommandHandler(TestCacheCommand)
export class TestCacheHandler implements ICommandHandler<TestCacheCommand> {
  constructor(@Inject(CACHE_PORT) private readonly cachePort: CachePort) {}

  async execute(command: TestCacheCommand): Promise<string> {
    const { key } = command;

    // Intentamos obtener el valor desde Redis
    const value = await this.cachePort.get(key);

    // Si no hay valor, devolvemos un mensaje por defecto
    if (!value) {
      return `No se encontró ningún valor para la clave: ${key}`;
    }

    return `Valor encontrado: ${value}`;
  }
}