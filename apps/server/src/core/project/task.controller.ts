import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TaskService } from './services/task.service';
import {
  TaskIdDto,
  CreateTaskDto,
  UpdateTaskDto,
  TaskListByProjectDto,
  TaskListBySpaceDto,
  TaskAssignmentDto,
  TaskCompletionDto,
  MoveTaskToProjectDto,
} from './dto/task.dto';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Workspace } from '../../database/types/entity.types';
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from '../casl/interfaces/space-ability.type';
import SpaceAbilityFactory from '../casl/abilities/space-ability.factory';
import { ProjectService } from './services/project.service';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly projectService: ProjectService,
    private readonly spaceAbility: SpaceAbilityFactory,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('/info')
  async getTask(@Body() dto: TaskIdDto, @AuthUser() user: User) {
    const task = await this.taskService.findById(dto.taskId, {
      includeCreator: true,
      includeAssignee: true,
      includeProject: true,
      includeParentTask: true,
      includeLabels: true,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const ability = await this.spaceAbility.createForUser(user, task.spaceId);
    if (ability.cannot(SpaceCaslAction.Read, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    return task;
  }

  @HttpCode(HttpStatus.OK)
  @Post('/list-by-project')
  async listTasksByProject(
    @Body() dto: TaskListByProjectDto,
    @AuthUser() user: User,
  ) {
    const project = await this.projectService.findById(dto.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const ability = await this.spaceAbility.createForUser(
      user,
      project.spaceId,
    );
    if (ability.cannot(SpaceCaslAction.Read, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    const { page, limit, projectId, status, searchTerm, includeSubtasks } = dto;
    return this.taskService.findByProjectId(
      projectId,
      { page, limit },
      {
        status,
        searchTerm,
        includeSubtasks,
        includeCreator: true,
        includeAssignee: true,
      },
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/list-by-space')
  async listTasksBySpace(
    @Body() dto: TaskListBySpaceDto,
    @AuthUser() user: User,
  ) {
    const ability = await this.spaceAbility.createForUser(user, dto.spaceId);
    if (ability.cannot(SpaceCaslAction.Read, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    const { page, limit, spaceId, status, searchTerm } = dto;
    return this.taskService.findBySpaceId(
      spaceId,
      { page, limit },
      {
        status,
        searchTerm,
        includeCreator: true,
        includeAssignee: true,
        includeProject: true,
      },
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/create')
  async createTask(
    @Body() dto: CreateTaskDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    const ability = await this.spaceAbility.createForUser(user, dto.spaceId);
    if (ability.cannot(SpaceCaslAction.Create, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    return this.taskService.create(user.id, workspace.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/update')
  async updateTask(@Body() dto: UpdateTaskDto, @AuthUser() user: User) {
    const task = await this.taskService.findById(dto.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const ability = await this.spaceAbility.createForUser(user, task.spaceId);
    if (ability.cannot(SpaceCaslAction.Edit, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    const { taskId, ...updateData } = dto;
    return this.taskService.update(taskId, updateData);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/delete')
  async deleteTask(@Body() dto: TaskIdDto, @AuthUser() user: User) {
    const task = await this.taskService.findById(dto.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const ability = await this.spaceAbility.createForUser(user, task.spaceId);
    if (ability.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    await this.taskService.delete(dto.taskId);
    return { success: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('/assign')
  async assignTask(@Body() dto: TaskAssignmentDto, @AuthUser() user: User) {
    const task = await this.taskService.findById(dto.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const ability = await this.spaceAbility.createForUser(user, task.spaceId);
    if (ability.cannot(SpaceCaslAction.Edit, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    return this.taskService.assignTask(dto.taskId, dto.assigneeId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/complete')
  async completeTask(@Body() dto: TaskCompletionDto, @AuthUser() user: User) {
    const task = await this.taskService.findById(dto.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const ability = await this.spaceAbility.createForUser(user, task.spaceId);
    if (ability.cannot(SpaceCaslAction.Edit, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    if (dto.isCompleted) {
      return this.taskService.markCompleted(dto.taskId);
    } else {
      return this.taskService.markIncomplete(dto.taskId);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/move-to-project')
  async moveTaskToProject(
    @Body() dto: MoveTaskToProjectDto,
    @AuthUser() user: User,
  ) {
    const task = await this.taskService.findById(dto.taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const ability = await this.spaceAbility.createForUser(user, task.spaceId);
    if (ability.cannot(SpaceCaslAction.Edit, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    return this.taskService.moveToProject(dto.taskId, dto.projectId);
  }
}
