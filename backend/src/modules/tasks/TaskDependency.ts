import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

interface TaskDependencyAttributes {
  id: number;
  taskId: number; // The task that has the dependency
  dependsOnTaskId: number; // The task that this task depends on
  dependencyType: DependencyType;
  lagTime?: number; // Delay in days between tasks (can be negative for overlap)
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskDependencyCreationAttributes extends Optional<TaskDependencyAttributes, 'id'> {}

export class TaskDependency extends Model<TaskDependencyAttributes, TaskDependencyCreationAttributes> implements TaskDependencyAttributes {
  public id!: number;
  public taskId!: number;
  public dependsOnTaskId!: number;
  public dependencyType!: DependencyType;
  public lagTime?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TaskDependency.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tasks',
        key: 'id'
      }
    },
    dependsOnTaskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tasks',
        key: 'id'
      }
    },
    dependencyType: {
      type: DataTypes.ENUM('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'),
      allowNull: false,
      defaultValue: 'finish_to_start'
    },
    lagTime: {
      type: DataTypes.INTEGER, // in days, can be negative
      allowNull: true,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'TaskDependency',
    indexes: [
      {
        unique: true,
        fields: ['taskId', 'dependsOnTaskId'],
        name: 'unique_task_dependency'
      }
    ]
  }
);
