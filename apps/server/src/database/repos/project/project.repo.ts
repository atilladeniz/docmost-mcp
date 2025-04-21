import { Injectable } from '@nestjs/common';
import { InjectKysely } from '@docmost/nestjs-kysely';
import { Kysely, Transaction as KyselyTransaction } from 'kysely';
import { DB } from '../../types/db';
import {
  InsertableProject,
  Project,
  UpdatableProject,
} from '../../types/entity.types';
import { dbOrTx } from '../../utils';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import { Paginated } from '@docmost/db/pagination/paginated';
import { paginate } from '@docmost/db/pagination/paginate';

@Injectable()
export class ProjectRepo {
  constructor(@InjectKysely() private readonly db: Kysely<DB>) {}

  async findById(
    projectId: string,
    options?: {
      includeCreator?: boolean;
    },
    trx?: KyselyTransaction<DB>,
  ): Promise<Project | undefined> {
    let query = dbOrTx(this.db, trx)
      .selectFrom('projects')
      .selectAll()
      .where('projects.id', '=', projectId)
      .where('projects.deletedAt', 'is', null);

    if (options?.includeCreator) {
      query = query
        .leftJoin('users as creator', 'creator.id', 'projects.creatorId')
        .select([
          'creator.id as creator_id',
          'creator.name as creator_name',
          'creator.email as creator_email',
          'creator.avatarUrl as creator_avatar_url',
        ]);
    }

    const project = await query.executeTakeFirst();
    return project as Project | undefined;
  }

  async findBySpaceId(
    spaceId: string,
    pagination: PaginationOptions,
    options?: {
      includeArchived?: boolean;
      includeCreator?: boolean;
      searchTerm?: string;
    },
    trx?: KyselyTransaction<DB>,
  ): Promise<Paginated<Project>> {
    let query = dbOrTx(this.db, trx)
      .selectFrom('projects')
      .selectAll()
      .where('projects.spaceId', '=', spaceId)
      .where('projects.deletedAt', 'is', null);

    if (!options?.includeArchived) {
      query = query.where('projects.isArchived', '=', false);
    }

    if (options?.searchTerm) {
      query = query.where((eb) =>
        eb.or([
          eb('projects.name', 'ilike', `%${options.searchTerm}%`),
          eb('projects.description', 'ilike', `%${options.searchTerm}%`),
        ]),
      );
    }

    if (options?.includeCreator) {
      query = query
        .leftJoin('users as creator', 'creator.id', 'projects.creatorId')
        .select([
          'creator.id as creator_id',
          'creator.name as creator_name',
          'creator.email as creator_email',
          'creator.avatarUrl as creator_avatar_url',
        ]);
    }

    return paginate(query, pagination);
  }

  async findByWorkspaceId(
    workspaceId: string,
    pagination: PaginationOptions,
    options?: {
      includeArchived?: boolean;
      includeCreator?: boolean;
      searchTerm?: string;
    },
    trx?: KyselyTransaction<DB>,
  ): Promise<Paginated<Project>> {
    let query = dbOrTx(this.db, trx)
      .selectFrom('projects')
      .selectAll()
      .where('projects.workspaceId', '=', workspaceId)
      .where('projects.deletedAt', 'is', null);

    if (!options?.includeArchived) {
      query = query.where('projects.isArchived', '=', false);
    }

    if (options?.searchTerm) {
      query = query.where((eb) =>
        eb.or([
          eb('projects.name', 'ilike', `%${options.searchTerm}%`),
          eb('projects.description', 'ilike', `%${options.searchTerm}%`),
        ]),
      );
    }

    if (options?.includeCreator) {
      query = query
        .leftJoin('users as creator', 'creator.id', 'projects.creatorId')
        .select([
          'creator.id as creator_id',
          'creator.name as creator_name',
          'creator.email as creator_email',
          'creator.avatarUrl as creator_avatar_url',
        ]);
    }

    return paginate(query, pagination);
  }

  async create(
    projectData: InsertableProject,
    trx?: KyselyTransaction<DB>,
  ): Promise<Project> {
    const project = await dbOrTx(this.db, trx)
      .insertInto('projects')
      .values(projectData)
      .returningAll()
      .executeTakeFirstOrThrow();

    return project as Project;
  }

  async update(
    projectId: string,
    updateData: UpdatableProject,
    trx?: KyselyTransaction<DB>,
  ): Promise<Project | undefined> {
    const project = await dbOrTx(this.db, trx)
      .updateTable('projects')
      .set({ ...updateData, updatedAt: new Date() })
      .where('id', '=', projectId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();

    return project as Project | undefined;
  }

  async softDelete(
    projectId: string,
    trx?: KyselyTransaction<DB>,
  ): Promise<void> {
    await dbOrTx(this.db, trx)
      .updateTable('projects')
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where('id', '=', projectId)
      .where('deletedAt', 'is', null)
      .execute();
  }

  async forceDelete(
    projectId: string,
    trx?: KyselyTransaction<DB>,
  ): Promise<void> {
    await dbOrTx(this.db, trx)
      .deleteFrom('projects')
      .where('id', '=', projectId)
      .execute();
  }

  async archive(
    projectId: string,
    trx?: KyselyTransaction<DB>,
  ): Promise<Project | undefined> {
    const project = await dbOrTx(this.db, trx)
      .updateTable('projects')
      .set({ isArchived: true, updatedAt: new Date() })
      .where('id', '=', projectId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();

    return project as Project | undefined;
  }

  async unarchive(
    projectId: string,
    trx?: KyselyTransaction<DB>,
  ): Promise<Project | undefined> {
    const project = await dbOrTx(this.db, trx)
      .updateTable('projects')
      .set({ isArchived: false, updatedAt: new Date() })
      .where('id', '=', projectId)
      .where('deletedAt', 'is', null)
      .returningAll()
      .executeTakeFirst();

    return project as Project | undefined;
  }
}
