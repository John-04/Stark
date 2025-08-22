import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BountiesModule } from './modules/bounties/bounties.modules';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { PrismaModule } from './prisma/prisma.modules';
import { StarknetModule } from './modules/starknet/starknet.module';
import { QueriesModule } from './modules/queries/queries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BountiesModule,
    SubmissionsModule,
    StarknetModule,
    QueriesModule,
  ],
})
export class AppModule {}
