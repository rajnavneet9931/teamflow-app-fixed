import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Reminder, ReminderRelations} from '../models';

export class ReminderRepository extends DefaultCrudRepository<
  Reminder,
  typeof Reminder.prototype.id,
  ReminderRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Reminder, dataSource);
  }
}
