import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface TaskAttributes {
  id: number;
  title: string;
  description: string;
  projectId: number;
  assigneeId: number;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  labels?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'status' | 'priority' | 'dueDate' | 'labels' | 'estimatedHours' | 'actualHours'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public projectId!: number;
  public assigneeId!: number;
  public status!: 'todo' | 'in_progress' | 'done';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public dueDate?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id'
      }
    },
    assigneeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'done'),
      defaultValue: 'todo'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    labels: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estimatedHours: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    actualHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'Task'
  }
);
