import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiQuery({ name: 'onlyUnread', required: false, type: Boolean })
  findAll(
    @CurrentTenant() tenantId: string,
    @Request() req: any,
    @Query('onlyUnread') onlyUnread?: string,
  ) {
    return this.notificationService.findAll(tenantId, req.user.userId, onlyUnread === 'true');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentTenant() tenantId: string, @Request() req: any) {
    return this.notificationService.getUnreadCount(tenantId, req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by id' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string, @Request() req: any) {
    return this.notificationService.findOne(id, tenantId, req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string, @CurrentTenant() tenantId: string, @Request() req: any) {
    return this.notificationService.markAsRead(id, tenantId, req.user.userId);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentTenant() tenantId: string, @Request() req: any) {
    return this.notificationService.markAllAsRead(tenantId, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string, @Request() req: any) {
    return this.notificationService.delete(id, tenantId, req.user.userId);
  }
}
