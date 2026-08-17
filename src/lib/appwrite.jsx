import { Client, Databases, Storage, Account, ID, Query } from 'appwrite';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a7e40de002c4df49de1');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const APPWRITE_CONFIG = {
  DATABASE_ID: '6a7e41b20037ce22279c',
  BUCKET_ID: '6a7f988f0019a7c08620',
  TABLES: {
    SALAS: 'salas',
    MAPAS: 'mapas',
    TOKENS: 'tokens',
    FOLHETOS: 'folhetos'
  }
};

export { ID, Query };