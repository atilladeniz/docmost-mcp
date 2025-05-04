import { Injectable } from '@nestjs/common';
import { ProjectRepo } from '../../../database/repos/project/project.repo';
import { SpaceRepo } from '../../../database/repos/space/space.repo';
import {
  ProjectView,
  InsertableProject,
  Project,
  UpdatableProject,
} from '../../../database/types/entity.types';
import { PaginationOptions } from '../../../lib/pagination/pagination-options';
import { Paginated } from '../../../lib/pagination/paginated';

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
    console.log('ProjectService.create called with:', {
      userId,
      workspaceId,
      data,
    });

    // Verify the space exists and belongs to the workspace
    const space = await this.spaceRepo.findById(data.spaceId, workspaceId);
    if (!space || space.workspaceId !== workspaceId) {
      throw new Error('Space not found or does not belong to the workspace');
    }

    console.log('Space found:', {
      id: space.id,
      name: space.name,
      workspaceId: space.workspaceId,
    });

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

    console.log(
      'Creating project with data:',
      JSON.stringify(projectData, null, 2),
    );
    const result = await this.projectRepo.create(projectData);
    console.log('Project created result:', JSON.stringify(result, null, 2));
    return result;
  }

  async update(
    projectId: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      coverImage?: string | null;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Project | undefined> {
    console.log('ProjectService.update called with:', { projectId, data });
    const updateData: UpdatableProject = {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
    };
    console.log('ProjectService.update: prepared updateData:', updateData);

    try {
      const result = await this.projectRepo.update(projectId, updateData);
      console.log('ProjectService.update: result:', result);
      return result;
    } catch (error) {
      console.error('ProjectService.update: error:', error);
      throw error;
    }
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
