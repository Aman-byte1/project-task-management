import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface TimeEntryAttributes {
  id: number;
  taskId: number;
  userId: number;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  description?: string;
  isRunning: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TimeEntryCreationAttributes extends Optional<TimeEntryAttributes, 'id'> {}

export class TimeEntry extends Model<TimeEntryAttributes, TimeEntryCreationAttributes> implements TimeEntryAttributes {
  public id!: number;
  public taskId!: number;
  public userId!: number;
  public startTime!: Date;
  public endTime?: Date;
  public duration?: number;
  public description?: string;
  public isRunning!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TimeEntry.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isRunning: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'TimeEntry'
  }
);
