import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemConfig, SystemConfigSchema } from './system-config.schema';
import { GlobalConfigService } from './global-config.service';
import { GlobalConfigController } from './global-config.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
  ],
  controllers: [GlobalConfigController],
  providers: [GlobalConfigService],
  exports: [GlobalConfigService],
})
export class GlobalConfigModule {}
