import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { QueriesService } from './queries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('queries')
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async saveQuery(@Body() data: { name: string, query: string, visualizationType: string }, @Req() req) {
    return this.queriesService.saveQuery(req.user.userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getSavedQueries(@Req() req) {
    return this.queriesService.getSavedQueries(req.user.userId);
  }
}
