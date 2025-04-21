import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './services/project.service';
import { TaskService } from './services/task.service';
import { TaskController } from './task.controller';
import { DatabaseModule } from '../../database/database.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [DatabaseModule, CaslModule],
  controllers: [ProjectController, TaskController],
  providers: [ProjectService, TaskService],
  exports: [ProjectService, TaskService],
})
export class ProjectModule {}
