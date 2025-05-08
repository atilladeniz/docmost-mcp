import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../constants/task-enums';
import { PaginationOptionsDto } from '../../../common/dto/pagination-options.dto';

export class TaskIdDto {
  @IsUUID()
  taskId: string;
}

export class CreateTaskDto {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  parentTaskId?: string;

  @IsUUID()
  @IsOptional()
  pageId?: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsUUID()
  spaceId: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  estimatedTime?: number;
}

export class UpdateTaskDto {
  @IsUUID()
  taskId: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsUUID()
  @IsOptional()
  assigneeId?: string | null;

  @IsUUID()
  @IsOptional()
  pageId?: string | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  estimatedTime?: number;

  @IsString()
  @IsOptional()
  position?: string;
}

export class TaskListByProjectDto extends PaginationOptionsDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsEnum(TaskStatus, { each: true })
  status?: TaskStatus[];

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsBoolean()
  includeSubtasks?: boolean;
}

export class TaskListBySpaceDto extends PaginationOptionsDto {
  @IsUUID()
  spaceId: string;

  @IsOptional()
  @IsEnum(TaskStatus, { each: true })
  status?: TaskStatus[];

  @IsOptional()
  @IsString()
  searchTerm?: string;
}

export class TaskAssignmentDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string | null;
}

export class TaskCompletionDto {
  @IsUUID()
  taskId: string;

  @IsBoolean()
  isCompleted: boolean;
}

export class MoveTaskToProjectDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  @IsOptional()
  projectId: string | null;
}
