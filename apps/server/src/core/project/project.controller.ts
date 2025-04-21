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
import { ProjectService } from './services/project.service';
import {
  ProjectIdDto,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectListDto,
  ProjectArchiveDto,
} from './dto/project.dto';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Workspace } from '../../database/types/entity.types';
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from '../casl/interfaces/space-ability.type';
import SpaceAbilityFactory from '../casl/abilities/space-ability.factory';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly spaceAbility: SpaceAbilityFactory,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('/info')
  async getProject(@Body() dto: ProjectIdDto, @AuthUser() user: User) {
    const project = await this.projectService.findById(dto.projectId, {
      includeCreator: true,
    });

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

    return project;
  }

  @HttpCode(HttpStatus.OK)
  @Post('/list')
  async listProjects(@Body() dto: ProjectListDto, @AuthUser() user: User) {
    const ability = await this.spaceAbility.createForUser(user, dto.spaceId);
    if (ability.cannot(SpaceCaslAction.Read, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    const { page, limit, ...options } = dto;
    return this.projectService.findBySpaceId(
      dto.spaceId,
      { page, limit },
      {
        includeArchived: options.includeArchived,
        includeCreator: true,
        searchTerm: options.searchTerm,
      },
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/create')
  async createProject(
    @Body() dto: CreateProjectDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    const ability = await this.spaceAbility.createForUser(user, dto.spaceId);
    if (ability.cannot(SpaceCaslAction.Create, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    return this.projectService.create(user.id, workspace.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/update')
  async updateProject(@Body() dto: UpdateProjectDto, @AuthUser() user: User) {
    const project = await this.projectService.findById(dto.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const ability = await this.spaceAbility.createForUser(
      user,
      project.spaceId,
    );
    if (ability.cannot(SpaceCaslAction.Edit, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    const { projectId, ...updateData } = dto;
    return this.projectService.update(projectId, updateData);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/delete')
  async deleteProject(@Body() dto: ProjectIdDto, @AuthUser() user: User) {
    const project = await this.projectService.findById(dto.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const ability = await this.spaceAbility.createForUser(
      user,
      project.spaceId,
    );
    if (ability.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    await this.projectService.delete(dto.projectId);
    return { success: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('/archive')
  async archiveProject(@Body() dto: ProjectArchiveDto, @AuthUser() user: User) {
    const project = await this.projectService.findById(dto.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const ability = await this.spaceAbility.createForUser(
      user,
      project.spaceId,
    );
    if (ability.cannot(SpaceCaslAction.Edit, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    if (dto.isArchived) {
      return this.projectService.archive(dto.projectId);
    } else {
      return this.projectService.unarchive(dto.projectId);
    }
  }
}
