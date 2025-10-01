import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface RefreshTokenAttributes {
  id: number;
  token: string;
  userId: number;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 'id' | 'isRevoked'> {}

export class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  public id!: number;
  public token!: string;
  public userId!: number;
  public expiresAt!: Date;
  public isRevoked!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Check if token is expired
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  // Check if token is valid (not revoked and not expired)
  public isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    indexes: [
      {
        fields: ['token'],
        unique: true,
        name: 'refresh_token_unique'
      },
      {
        fields: ['userId'],
        name: 'refresh_token_user_id_index'
      },
      {
        fields: ['expiresAt'],
        name: 'refresh_token_expires_at_index'
      }
    ]
  }
);
