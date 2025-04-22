import { Module } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DB } from './types/db';
import { ProjectRepo } from './repos/project/project.repo';
import { SpaceRepo } from './repos/space/space.repo';
import { TaskRepo } from './repos/task/task.repo';
import { KYSELY } from '../lib/kysely/nestjs-kysely';

@Module({
  providers: [
    {
      provide: KYSELY,
      useFactory: () => {
        const dialect = new PostgresDialect({
          pool: new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.DB_NAME || 'docmost',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
          }),
        });

        return new Kysely<DB>({
          dialect,
        });
      },
    },
    ProjectRepo,
    SpaceRepo,
    TaskRepo,
  ],
  exports: [KYSELY, ProjectRepo, SpaceRepo, TaskRepo],
})
export class DatabaseModule {}
