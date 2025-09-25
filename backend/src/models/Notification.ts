import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type NotificationType = 'task_assigned' | 'project_assigned' | 'task_completed' | 'project_completed' | 'task_due' | 'comment_added';

interface NotificationAttributes {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: number; // ID of related task, project, etc.
  relatedType?: 'task' | 'project' | 'comment';
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'isRead'> {}

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public userId!: number;
  public type!: NotificationType;
  public title!: string;
  public message!: string;
  public relatedId?: number;
  public relatedType?: 'task' | 'project' | 'comment';
  public isRead!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('task_assigned', 'project_assigned', 'task_completed', 'project_completed', 'task_due', 'comment_added'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    relatedType: {
      type: DataTypes.ENUM('task', 'project', 'comment'),
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  },
  {
    sequelize,
    modelName: 'Notification',
    indexes: [
      {
        fields: ['userId', 'isRead'],
        name: 'user_notifications_index'
      },
      {
        fields: ['createdAt'],
        name: 'notification_created_at_index'
      }
    ]
  }
);
