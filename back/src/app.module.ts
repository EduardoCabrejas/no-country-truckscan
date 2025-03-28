import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { CommonModule } from './common/common.module';
import { FormulariosModule } from './formularios/formularios.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `.env.${process.env.NODE_ENV}`,
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: +(process.env.DB_PORT || 5433),
            database: process.env.DB_NAME,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            entities: ['dist/**/*.entity{.ts,.js}'],
            synchronize: true,
            autoLoadEntities: true,
       }),


        VehiculosModule,
        CommonModule,
        FormulariosModule,
        AuthModule, 
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}