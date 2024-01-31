import { Entity, Column, ObjectIdColumn, PrimaryGeneratedColumn } from 'typeorm';
import { TODO_STATUS } from '../utils';

@Entity()
export class Todos {
  @ObjectIdColumn()
  id: string;

  @PrimaryGeneratedColumn()
  rawid: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ enum: TODO_STATUS })
  state: string;

  @Column()
  duedate: number;
}
