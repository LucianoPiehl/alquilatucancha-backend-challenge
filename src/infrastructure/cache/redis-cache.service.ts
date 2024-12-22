import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisCacheService {
  private client;

  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.connect();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) {
      return null; // Si no hay datos, devolvemos null
    }

    try {
      return JSON.parse(data) as T; // Convertimos string a JSON
    } catch (error) {
      console.error(`Error al parsear JSON del caché para la clave ${key}:`, error);
      return null; // En caso de error, devolvemos null
    }
  }

  async set(key: string, value: any): Promise<void> {
    let valueToStore: string;

    try {
      valueToStore = JSON.stringify(value); // Convertimos el objeto a string
    } catch (error) {
      console.error(`Error al serializar JSON para guardar en Redis:`, error);
      throw error; // Propagamos el error si falla
    }

    await this.client.set(key, valueToStore); // Guardamos el JSON serializado
  }

  async del(key: string): Promise<void> {
    await this.client.del(key); // Borramos la clave como antes
  }
}
