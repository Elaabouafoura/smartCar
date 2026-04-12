import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {

  @PrimaryGeneratedColumn('uuid')
  id!: string;


  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

 
  @Column({ length: 100 })
  name!: string;

  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl?: string;


  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;


  @Column({ length: 5, default: 'en' })
  language!: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({
    name: 'notification_prefs',
    type: 'jsonb',
    default: () => "'{}'",
  })
  notificationPrefs!: Record<string, any>;


  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
