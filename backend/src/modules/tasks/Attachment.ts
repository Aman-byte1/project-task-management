import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface AttachmentAttributes {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  taskId?: number;
  projectId?: number;
  uploadedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AttachmentCreationAttributes extends Optional<AttachmentAttributes, 'id'> {}

export class Attachment extends Model<AttachmentAttributes, AttachmentCreationAttributes> implements AttachmentAttributes {
  public id!: number;
  public filename!: string;
  public originalName!: string;
  public mimeType!: string;
  public size!: number;
  public path!: string;
  public taskId?: number;
  public projectId?: number;
  public uploadedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Tasks',
        key: 'id'
      }
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Projects',
        key: 'id'
      }
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'Attachment'
  }
);
