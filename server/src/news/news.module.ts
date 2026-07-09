import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsArticle } from './entities/news-article.entity';
import { DeathRecord } from './entities/death-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NewsArticle, DeathRecord])],
  exports: [TypeOrmModule, TypeOrmModule.forFeature([NewsArticle, DeathRecord])],
})
export class NewsModule {}
