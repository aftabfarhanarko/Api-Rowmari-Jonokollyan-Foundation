import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker/worker.module';

async function bootstrapWorker() {
  const logger = new Logger('WorkerBootstrap');
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();

  logger.log('=======================================================');
  logger.log('👷 Romonijon BullMQ Background Worker Started Successfully');
  logger.log('=======================================================');
}

void bootstrapWorker();
