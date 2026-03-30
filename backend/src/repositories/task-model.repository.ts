import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {TaskModel, TaskModelRelations} from '../models';

export class TaskModelRepository extends DefaultCrudRepository<
  TaskModel,
  typeof TaskModel.prototype.id,
  TaskModelRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(TaskModel, dataSource);
  }
}
