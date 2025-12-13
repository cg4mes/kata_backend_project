import { Indicators } from 'src/indicators-module/indicators.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  product: string;

  @Column({ unique: true })
  @Index()
  prefix: string;

  @Column({ type: 'int' })
  totalDefinedTests: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Indicators, (indicator) => indicator.project)
  indicators: Indicators[];
}
