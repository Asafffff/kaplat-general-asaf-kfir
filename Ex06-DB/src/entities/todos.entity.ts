import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TODO_STATUS } from '../utils';

@Entity()
export class Todos {
  @PrimaryGeneratedColumn('uuid')
  rawid!: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ enum: TODO_STATUS })
  state: string;

  @Column()
  duedate: number;
}
