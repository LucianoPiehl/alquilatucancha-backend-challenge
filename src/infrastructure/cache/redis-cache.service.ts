import { Injectable } from '@nestjs/common';
import { CachePort } from '../../domain/ports/cache.port';
import { createClient } from 'redis';

@Injectable()
export class RedisCacheService implements CachePort {
  private client;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379',
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.connect();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Error al parsear JSON del caché para la clave ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    let valueToStore: string;

    try {
      valueToStore = JSON.stringify(value);
    } catch (error) {
      console.error(`Error al serializar JSON para guardar en Redis:`, error);
      throw error;
    }

    await this.client.set(key, valueToStore);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
  async clearAll(): Promise<void> {
    const keys = await this.client.keys('*'); // Obtiene todas las claves
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.del(key))); // Borra cada clave
    }
  }
}