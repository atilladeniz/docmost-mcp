import { Inject } from '@nestjs/common';

export const KYSELY = 'KYSELY';

export const InjectKysely = () => Inject(KYSELY);
