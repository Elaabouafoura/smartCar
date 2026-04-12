import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('password_reset_tokens')
export class ResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  tokenHash!: string;

  @Column()
  expiresAt!: Date;
  @Column({ default: false })
  used!: boolean;

}
