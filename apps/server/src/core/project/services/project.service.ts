import { Injectable } from '@nestjs/common';
import { ProjectRepo } from '../../../database/repos/project/project.repo';
import { SpaceRepo } from '../../../database/repos/space/space.repo';
import {
  ProjectView,
  InsertableProject,
  Project,
  UpdatableProject,
} from '../../../database/types/entity.types';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import { Paginated } from '@docmost/db/pagination/paginated';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepo,
    private readonly spaceRepo: SpaceRepo,
  ) {}

  async findById(
    projectId: string,
    options?: {
      includeCreator?: boolean;
    },
  ): Promise<Project | undefined> {
    return this.projectRepo.findById(projectId, options);
  }

  async findBySpaceId(
    spaceId: string,
    pagination: PaginationOptions,
    options?: {
      includeArchived?: boolean;
      includeCreator?: boolean;
      searchTerm?: string;
    },
  ): Promise<Paginated<Project>> {
    return this.projectRepo.findBySpaceId(spaceId, pagination, options);
  }

  async findByWorkspaceId(
    workspaceId: string,
    pagination: PaginationOptions,
    options?: {
      includeArchived?: boolean;
      includeCreator?: boolean;
      searchTerm?: string;
    },
  ): Promise<Paginated<Project>> {
    return this.projectRepo.findByWorkspaceId(workspaceId, pagination, options);
  }

  async create(
    userId: string,
    workspaceId: string,
    data: {
      name: string;
      description?: string;
      spaceId: string;
      icon?: string;
      color?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Project> {
    // Verify the space exists and belongs to the workspace
    const space = await this.spaceRepo.findById(data.spaceId);
    if (!space || space.workspaceId !== workspaceId) {
      throw new Error('Space not found or does not belong to the workspace');
    }

    const projectData: InsertableProject = {
      name: data.name,
      description: data.description,
      spaceId: data.spaceId,
      workspaceId,
      creatorId: userId,
      icon: data.icon,
      color: data.color,
      startDate: data.startDate,
      endDate: data.endDate,
      isArchived: false,
    };

    return this.projectRepo.create(projectData);
  }

  async update(
    projectId: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Project | undefined> {
    const updateData: UpdatableProject = {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
    };

    return this.projectRepo.update(projectId, updateData);
  }

  async delete(projectId: string): Promise<void> {
    await this.projectRepo.softDelete(projectId);
  }

  async archive(projectId: string): Promise<Project | undefined> {
    return this.projectRepo.archive(projectId);
  }

  async unarchive(projectId: string): Promise<Project | undefined> {
    return this.projectRepo.unarchive(projectId);
  }
}
