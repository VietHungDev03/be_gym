import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';

let cachedServer: any;

async function bootstrapServer() {
  const server = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  // CORS (nhớ set CORS_ORIGIN trên Vercel = URL frontend)
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // giống main.ts của bạn
  app.setGlobalPrefix('api');

  await app.init();
  return server;
}

export default async function handler(req: Request, res: Response) {
  if (!cachedServer) cachedServer = await bootstrapServer();
  return cachedServer(req, res);
}
