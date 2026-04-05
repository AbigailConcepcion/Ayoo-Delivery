// ambient declarations to satisfy TypeScript when dependencies are not installed in this environment

declare module 'express' {
  const express: any;
  export = express;
  export type Application = any;
  export type Request = any;
  export type Response = any;
  export type NextFunction = any;
}

// if @types/express are installed normally, this file is not needed

declare module 'uuid' {
  export function v4(): string;
}

declare module 'zod' {
  export const z: any;
}

declare module 'jsonwebtoken';
declare module 'bcrypt';
declare module 'better-sqlite3';
declare module 'morgan';
declare module 'cors';
declare module 'dotenv';

declare module 'stripe';
declare module 'express-rate-limit';
declare module 'socket.io';
declare module 'socket.io-client';
declare module 'pg';
declare module '@socket.io/redis-adapter';
declare module 'ioredis';
declare module 'winston';
