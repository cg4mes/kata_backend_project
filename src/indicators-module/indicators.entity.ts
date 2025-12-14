import { Project } from 'src/projects-module/projects.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Indicators {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.indicators)
  project: Project;

  @Column()
  projectId: string;

  @Column()
  pipelineType: string; // 'regression' | 'security' | 'performance'

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' }) //timestamp
  runDate: Date;

  // Métricas de Regression
  @Column('int', { nullable: true })
  totalTests: number;

  @Column('int', { nullable: true })
  passed: number;

  @Column('int', { nullable: true })
  failed: number;

  @Column('int', { nullable: true })
  skipped: number;

  @Column('float', { nullable: true })
  executionSuccessRate: number;

  @Column('float', { nullable: true })
  automationCoverage: number;

  // Métricas de Performance
  @Column('int', { nullable: true })
  totalRequest: number;

  @Column('int', { nullable: true })
  okRequest: number;

  @Column('int', { nullable: true })
  koRequest: number;

  @Column('float', { nullable: true })
  timeMean: number;

  @Column('float', { nullable: true })
  timeMax: number;

  @Column('float', { nullable: true })
  timeMin: number;

  @Column('float', { nullable: true })
  errorRate: number;

  // Métricas de Security
  @Column('int', { nullable: true })
  high: number;

  @Column('int', { nullable: true })
  medium: number;

  @Column('int', { nullable: true })
  low: number;

  @Column('int', { nullable: true })
  informational: number;

  @Column('float', { nullable: true })
  securityScore: number;
}
