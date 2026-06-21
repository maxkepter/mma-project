import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('news_articles')
export class NewsArticle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column()
  source!: string;

  @Column({ type: 'timestamptz' })
  publishDate!: Date;
}
