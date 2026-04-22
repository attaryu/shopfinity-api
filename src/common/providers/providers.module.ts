import { Global, Module } from '@nestjs/common';
import { PrismaProvider } from './prisma.provider';

import { MediaStorageProvider } from './media-storage.provider';

@Global()
@Module({
  providers: [PrismaProvider, MediaStorageProvider],
  exports: [PrismaProvider, MediaStorageProvider],
})
export class ProvidersModule {}
