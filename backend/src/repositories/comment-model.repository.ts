import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CommentModel, CommentModelRelations} from '../models';

export class CommentModelRepository extends DefaultCrudRepository<
  CommentModel,
  typeof CommentModel.prototype.id,
  CommentModelRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(CommentModel, dataSource);
  }
}
