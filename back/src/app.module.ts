import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import{ ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { AuthModule } from './auth/auth.module';
import { SensorReadingModule } from './sensor-reading/sensor-reading.module';
import { DtcModule } from './dtc/dtc.module';
import { UploadModule } from './upload/upload.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AlertsModule } from './alerts/alerts.module'
import { MechanicModule } from './mechanic/mechanic.module';
 @Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
  }),

  UsersModule,

  VehicleModule,

  AuthModule,

  AlertsModule,

  SensorReadingModule,

  DtcModule,

  UploadModule,

  MaintenanceModule,

  MechanicModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
