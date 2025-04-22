import { Injectable } from '@nestjs/common';
import { InjectKysely } from '../../../lib/kysely/nestjs-kysely';
import { Kysely, Transaction } from 'kysely';
import { DB, TaskStatus } from '../../types/db';
import { InsertableTask, Task, UpdatableTask } from '../../types/entity.types';
import { dbOrTx } from '../../utils';
import { PaginationOptions } from '../../../lib/pagination/pagination-options';
import { Paginated } from '../../../lib/pagination/paginated';
import { paginate } from '../../../lib/pagination/paginate';

@Injectable()
export class TaskRepo {
  constructor(@InjectKysely() private readonly db: Kysely<DB>) {}

  async findById(
    taskId: string,
    options?: {
      includeCreator?: boolean;
      includeAssignee?: boolean;
      includeProject?: boolean;
      includeParentTask?: boolean;
      includeLabels?: boolean;
      includeWatchers?: boolean;
    },
    trx?: Transaction<DB>,
  ): Promise<Task | undefined> {
    let query = dbOrTx(this.db, trx)
      .selectFrom('tasks')
      .selectAll('tasks')
      .where('tasks.id', '=', taskId)
      .where('tasks.deletedAt', 'is', null);

    if (options?.includeCreator) {
      query = query
        .leftJoin('users as creator', 'creator.id', 'tasks.creatorId')
        .select([
          'creator.id as creator_id',
          'creator.name as creator_name',
          'creator.email as creator_email',
          'creator.avatarUrl as creator_avatar_url',
        ]);
    }

    if (options?.includeAssignee) {
      query = query
        .leftJoin('users as assignee', 'assignee.id', 'tasks.assigneeId')
        .select([
          'assignee.id as assignee_id',
          'assignee.name as assignee_name',
          'assignee.email as assignee_email',
          'assignee.avatarUrl as assignee_avatar_url',
        ]);
    }

    if (options?.includeProject) {
      query = query
        .leftJoin('projects', 'projects.id', 'tasks.projectId')
        .select([
          'projects.id as project_id',
          'projects.name as project_name',
          'projects.icon as project_icon',
          'projects.color as project_color',
        ]);
    }

    if (options?.includeParentTask) {
      query = query
        .leftJoin('tasks as parentTask', 'parentTask.id', 'tasks.parentTaskId')
        .select([
          'parentTask.id as parent_task_id',
          'parentTask.title as parent_task_title',
        ]);
    }

    const task = await query.executeTakeFirst();

    // Additional logic for labels and watchers if needed
    if (task && options?.includeLabels) {
      const labels = await dbOrTx(this.db, trx)
        .selectFrom('taskLabelAssignments')
        .innerJoin(
          'taskLabels',
          'taskLabels.id',
          'taskLabelAssignments.labelId',
        )
        .select(['taskLabels.id', 'taskLabels.name', 'taskLabels.color'])
        .where('taskLabelAssignments.taskId', '=', taskId)
        .execute();

      (task as any).labels = labels;
    }

    if (task && options?.includeWatchers) {
      const watchers = await dbOrTx(this.db, trx)
        .selectFrom('taskWatchers')
        .innerJoin('users', 'users.id', 'taskWatchers.userId')
        .select(['users.id', 'users.name', 'users.email', 'users.avatarUrl'])
        .where('taskWatchers.taskId', '=', taskId)
        .execute();

      (task as any).watchers = watchers;
    }

    return task as Task | undefined;
  }

  async findByProjectId(
    projectId: string,
    pagination: PaginationOptions,
    options?: {
      status?: TaskStatus[];
      searchTerm?: string;
      includeSubtasks?: boolean;
      includeCreator?: boolean;
      includeAssignee?: boolean;
    },
    trx?: Transaction<DB>,
  ): Promise<Paginated<Task>> {
    let query = dbOrTx(this.db, trx)
      .selectFrom('tasks')
      .selectAll('tasks')
      .where('tasks.projectId', '=', projectId)
      .where('tasks.deletedAt', 'is', null);

    if (!options?.includeSubtasks) {
      query = query.where((eb) =>
        eb.or([
          eb('tasks.parentTaskId', 'is', null),
          eb('tasks.parentTaskId', '=', ''),
        ]),
      );
    }

    if (options?.status && options.status.length > 0) {
      query = query.where('tasks.status', 'in', options.status);
    }

    if (options?.searchTerm) {
      query = query.where((eb) =>
        eb.or([
          eb('tasks.title', 'ilike', `%${options.searchTerm}%`),
          eb('tasks.description', 'ilike', `%${options.searchTerm}%`),
        ]),
      );
    }

    if (options?.includeCreator) {
      query = query
        .leftJoin('users as creator', 'creator.id', 'tasks.creatorId')
        .select([
          'creator.id as creator_id',
          'creator.name as creator_name',
          'creator.email as creator_email',
          'creator.avatarUrl as creator_avatar_url',
        ]);
    }

    if (options?.includeAssignee) {
      query = query
        .leftJoin('users as assignee', 'assignee.id', 'tasks.assigneeId')
        .select([
          'assignee.id as assignee_id',
          'assignee.name as assignee_name',
          'assignee.email as assignee_email',
          'assignee.avatarUrl as assignee_avatar_url',
        ]);
    }

    return paginate(query, pagination);
  }

  async findByParentTaskId(
    parentTaskId: string,
    pagination: PaginationOptions,
    options?: {
      includeCreator?: boolean;
      includeAssignee?: boolean;
    },
    trx?: Transaction<DB>,
  ): Promise<Paginated<Task>> {
    let query = dbOrTx(this.db, trx)
      .selectFrom('tasks')
      .selectAll('tasks')
      .where('tasks.parentTaskId', '=', parentTaskId)
      .where('tasks.deletedAt', 'is', null);

    if (options?.includeCreator) {
      query = query
        .leftJoin('users as creator', 'creator.id', 'tasks.creatorId')
        .select([
          'creator.id as creator_id',
          'creator.name as creator_name',
          'creator.email as creator_email',
          'creator.avatarUrl as creator_avatar_url',
        ]);
    }

    if (options?.includeAssignee) {
      query = query
        .leftJoin('users as assignee', 'assignee.id', 'tasks.assigneeId')
        .select([
          'assignee.id as assignee_id',
          'assignee.name as assignee_name',
          'assignee.email as assignee_email',
          'assignee.avatarUrl as assignee_avatar_url',
        ]);
    }

    return paginate(query, pagination);
  }

  async findBySpaceId(
    spaceId: string,
    pagination: PaginationOptions,
    options?: {
      status?: TaskStatus[];
      searchTerm?: string;
      includeCreator?: boolean;
      includeAssignee?: boolean;
      includeProject?: boolean;
    },
    trx?: Transaction<DB>,
  ): Promise<Paginated<Task>> {
    let query = dbOrTx(this.db, trx)
      .selectFrom('tasks')
      .selectAll('tasks')
      .where('tasks.spaceId', '=', spaceId)
      .where('tasks.deletedAt', 'is', null);

    if (options?.status && options.status.length > 0) {
      query = query.where('tasks.status', 'in', options.status);
    }

    if (options?.searchTerm) {
      query = query.where((eb) =>
        eb.or([
          eb('tasks.title', 'ilike', `%${options.searchTerm}%`),
          eb('tasks.description', 'ilike', `%${options.searchTerm}%`),
        ]),
      );
    }

    if (options?.includeCreator) {
      query = query
        .leftJoin('users as creator', 'creator.id', 'tasks.creatorId')
        .select([
          'creator.id as creator_id',
          'creator.name as creator_name',
          'creator.email as creator_email',
          'creator.avatarUrl as creator_avatar_url',
        ]);
    }

    if (options?.includeAssignee) {
      query = query
        .leftJoin('users as assignee', 'assignee.id', 'tasks.assigneeId')
        .select([
          'assignee.id as assignee_id',
          'assignee.name as assignee_name',
          'assignee.email as assignee_email',
          'assignee.avatarUrl as assignee_avatar_url',
        ]);
    }

    if (options?.includeProject) {
      query = query
        .leftJoin('projects', 'projects.id', 'tasks.projectId')
        .select([
          'projects.id as project_id',
          'projects.name as project_name',
          'projects.color as project_color',
          'projects.icon as project_icon',
        ]);
    }

    return paginate(query, pagination);
  }

  async findByAssigneeId(
    assigneeId: string,
    pagination: PaginationOptions,
    options?: {
      status?: TaskStatus[];
      searchTerm?: string;
      includeCreator?: boolean;
      includeProject?: boolean;
      workspaceId?: string;
    },
    trx?: Transaction<DB>,
  ): Promise<Paginated<Task>> {
    let query = dbOrTx(this.db, trx)
      .selectFrom('tasks')
      .selectAll('tasks')
      .where('tasks.assigneeId', '=', assigneeId)
      .where('tasks.deletedAt', 'is', null);

    if (options?.workspaceId) {
      query = query.where('tasks.workspaceId', '=', options.workspaceId);
    }

    if (options?.status && options.status.length > 0) {
      query = query.where('tasks.status', 'in', options.status);
    }

    if (options?.searchTerm) {
      query = query.where((eb) =>
        eb.or([
          eb('tasks.title', 'ilike', `%${options.searchTerm}%`),
          eb('tasks.description', 'ilike', `%${options.searchTerm}%`),
        ]),
      );
    }

    if (options?.includeCreator) {
      query = query
        .leftJoin('users as creator', 'creator.id', 'tasks.creatorId')
        .select([
          'creator.id as creator_id',
          'creator.name as creator_name',
          'creator.email as creator_email',
          'creator.avatarUrl as creator_avatar_url',
        ]);
    }

    if (options?.includeProject) {
      query = query
        .leftJoin('projects', 'projects.id', 'tasks.projectId')
        .select([
          'projects.id as project_id',
          'projects.name as project_name',
          'projects.color as project_color',
          'projects.icon as project_icon',
        ]);
    }

    return paginate(query, pagination);
  }

  async create(taskData: InsertableTask, trx?: Transaction<DB>): Promise<Task> {
    const task = await dbOrTx(this.db, trx)
      .insertInto('tasks')
      .values(taskData)
      .returningAll()
      .executeTakeFirstOrThrow();

    return task as Task;
  }

  async update(
    taskId: string,
    updateData: UpdatableTask,
    trx?: Transaction<DB>,
  ): Promise<Task | undefined> {
    const task = await dbOrTx(this.db, trx)
      .updateTable('tasks')
      .set({ ...updateData, updatedAt: new Date() })
      .where('id', '=', taskId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();

    return task as Task | undefined;
  }

  async softDelete(taskId: string, trx?: Transaction<DB>): Promise<void> {
    await dbOrTx(this.db, trx)
      .updateTable('tasks')
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where('id', '=', taskId)
      .where('deletedAt', 'is', null)
      .execute();
  }

  async forceDelete(taskId: string, trx?: Transaction<DB>): Promise<void> {
    await dbOrTx(this.db, trx)
      .deleteFrom('tasks')
      .where('id', '=', taskId)
      .execute();
  }

  async markCompleted(
    taskId: string,
    trx?: Transaction<DB>,
  ): Promise<Task | undefined> {
    const task = await dbOrTx(this.db, trx)
      .updateTable('tasks')
      .set({
        status: 'done',
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where('id', '=', taskId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();

    return task as Task | undefined;
  }

  async markIncomplete(
    taskId: string,
    trx?: Transaction<DB>,
  ): Promise<Task | undefined> {
    const task = await dbOrTx(this.db, trx)
      .updateTable('tasks')
      .set({
        status: 'todo',
        isCompleted: false,
        completedAt: null,
        updatedAt: new Date(),
      })
      .where('id', '=', taskId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();

    return task as Task | undefined;
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    trx?: Transaction<DB>,
  ): Promise<Task | undefined> {
    const task = await dbOrTx(this.db, trx)
      .updateTable('tasks')
      .set({
        status,
        updatedAt: new Date(),
      })
      .where('id', '=', taskId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();

    return task as Task | undefined;
  }
}
