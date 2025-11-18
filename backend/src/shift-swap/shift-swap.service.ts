import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftSwapDto } from './dto/create-shift-swap.dto';
import { RespondToSwapDto } from './dto/respond-to-swap.dto';
import { EventBus, EventType, createEvent } from '../lib/events/domain-events';
import { metrics, MetricNames } from '../lib/metrics';
import { logger } from '../lib/logger';
import { SwapStatus } from '@prisma/client';

@Injectable()
export class ShiftSwapService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBus,
  ) {}

  async create(tenantId: string, userId: string, createShiftSwapDto: CreateShiftSwapDto) {
    const log = logger.child({ tenantId, userId, action: 'create_shift_swap' });

    // Verify requester assignment exists and belongs to requester
    const requesterAssignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        id: createShiftSwapDto.requesterAssignmentId,
        staff: { tenantId },
      },
      include: {
        staff: true,
        pattern: true,
      },
    });

    if (!requesterAssignment) {
      log.warn('Requester assignment not found', {
        assignmentId: createShiftSwapDto.requesterAssignmentId,
      });
      throw new NotFoundException('Shift assignment not found');
    }

    // Verify user owns this shift assignment
    if (requesterAssignment.staff.userId !== userId) {
      log.warn('User does not own this shift', {
        staffUserId: requesterAssignment.staff.userId,
      });
      throw new ForbiddenException('You can only swap your own shifts');
    }

    // If target staff specified, verify they exist
    if (createShiftSwapDto.targetStaffId) {
      const targetStaff = await this.prisma.staff.findFirst({
        where: {
          id: createShiftSwapDto.targetStaffId,
          tenantId,
        },
      });

      if (!targetStaff) {
        log.warn('Target staff not found', { targetStaffId: createShiftSwapDto.targetStaffId });
        throw new NotFoundException('Target staff not found');
      }

      // Cannot swap with self
      if (targetStaff.id === requesterAssignment.staffId) {
        log.warn('Attempt to swap with self');
        throw new BadRequestException('Cannot swap shift with yourself');
      }
    }

    const swapRequest = await this.prisma.shiftSwapRequest.create({
      data: {
        requesterStaffId: requesterAssignment.staffId,
        requesterAssignmentId: createShiftSwapDto.requesterAssignmentId,
        targetStaffId: createShiftSwapDto.targetStaffId,
        reason: createShiftSwapDto.reason,
        status: SwapStatus.PENDING,
        tenantId,
      },
      include: {
        requesterStaff: true,
        requesterAssignment: {
          include: {
            pattern: true,
          },
        },
        targetStaff: true,
      },
    });

    log.info('Shift swap request created', {
      swapRequestId: swapRequest.id,
      requesterStaffName: swapRequest.requesterStaff.name,
      targetStaffName: swapRequest.targetStaff?.name,
    });

    // Publish domain event
    await this.eventBus.publish(
      createEvent(EventType.SWAP_REQUESTED, swapRequest.id, tenantId, {
        requesterStaffId: swapRequest.requesterStaffId,
        requesterStaffName: swapRequest.requesterStaff.name,
        targetStaffId: swapRequest.targetStaffId,
        assignmentDate: swapRequest.requesterAssignment.date,
      }, userId),
    );

    // Track metrics
    await metrics.incrementCounter(MetricNames.SWAP_REQUESTED, {
      tenantId,
      hasTarget: swapRequest.targetStaffId ? 'true' : 'false',
    });

    return swapRequest;
  }

  async findAll(
    tenantId: string,
    filters?: {
      status?: SwapStatus;
      staffId?: string;
    },
  ) {
    const log = logger.child({ tenantId, action: 'find_all_swaps', filters });

    const where: any = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.staffId) {
      where.OR = [
        { requesterStaffId: filters.staffId },
        { targetStaffId: filters.staffId },
      ];
    }

    const swapRequests = await this.prisma.shiftSwapRequest.findMany({
      where,
      include: {
        requesterStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        requesterAssignment: {
          include: {
            pattern: true,
          },
        },
        targetStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        targetAssignment: {
          include: {
            pattern: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    log.debug('Swap requests retrieved', { count: swapRequests.length });

    return swapRequests;
  }

  async findOne(id: string, tenantId: string) {
    const log = logger.child({ tenantId, swapRequestId: id, action: 'find_one_swap' });

    const swapRequest = await this.prisma.shiftSwapRequest.findFirst({
      where: { id, tenantId },
      include: {
        requesterStaff: true,
        requesterAssignment: {
          include: {
            pattern: true,
          },
        },
        targetStaff: true,
        targetAssignment: {
          include: {
            pattern: true,
          },
        },
      },
    });

    if (!swapRequest) {
      log.warn('Swap request not found');
      throw new NotFoundException('Swap request not found');
    }

    log.debug('Swap request retrieved');

    return swapRequest;
  }

  async acceptOffer(id: string, tenantId: string, targetStaffId: string, userId: string) {
    const log = logger.child({
      tenantId,
      swapRequestId: id,
      targetStaffId,
      action: 'accept_swap_offer',
    });

    const swapRequest = await this.findOne(id, tenantId);

    // Verify status is PENDING
    if (swapRequest.status !== SwapStatus.PENDING) {
      log.warn('Swap request not in PENDING status', { status: swapRequest.status });
      throw new BadRequestException('This swap request is no longer available');
    }

    // Verify target staff exists and owns this staff record
    const targetStaff = await this.prisma.staff.findFirst({
      where: {
        id: targetStaffId,
        tenantId,
        userId,
      },
    });

    if (!targetStaff) {
      log.warn('Target staff not found or does not belong to user');
      throw new ForbiddenException('Invalid staff selection');
    }

    // If swap had a specific target, verify it matches
    if (swapRequest.targetStaffId && swapRequest.targetStaffId !== targetStaffId) {
      log.warn('Staff ID does not match target', {
        expectedTarget: swapRequest.targetStaffId,
      });
      throw new BadRequestException('This swap was offered to a different staff member');
    }

    // Find a shift to offer in return (simplified - just get any future shift from target)
    const targetAssignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        staffId: targetStaffId,
        date: {
          gte: swapRequest.requesterAssignment.date,
        },
      },
      orderBy: { date: 'asc' },
    });

    if (!targetAssignment) {
      log.warn('No suitable assignment found for target staff to offer');
      throw new BadRequestException('No suitable shift available to offer in exchange');
    }

    // Update swap request with target assignment
    const updatedSwap = await this.prisma.shiftSwapRequest.update({
      where: { id },
      data: {
        targetStaffId,
        targetAssignmentId: targetAssignment.id,
        status: SwapStatus.ACCEPTED_BY_STAFF,
      },
      include: {
        requesterStaff: true,
        requesterAssignment: true,
        targetStaff: true,
        targetAssignment: true,
      },
    });

    log.info('Swap offer accepted by staff', {
      targetStaffName: updatedSwap.targetStaff?.name,
    });

    return updatedSwap;
  }

  async respond(id: string, tenantId: string, userId: string, respondToSwapDto: RespondToSwapDto) {
    const log = logger.child({
      tenantId,
      swapRequestId: id,
      userId,
      action: 'respond_to_swap',
      response: respondToSwapDto.status,
    });

    const swapRequest = await this.findOne(id, tenantId);

    // Only pending or staff-accepted swaps can be responded to
    if (
      swapRequest.status !== SwapStatus.PENDING &&
      swapRequest.status !== SwapStatus.ACCEPTED_BY_STAFF
    ) {
      log.warn('Swap request cannot be modified', { status: swapRequest.status });
      throw new BadRequestException(
        `Cannot modify swap request with status ${swapRequest.status}`,
      );
    }

    const updatedSwap = await this.prisma.shiftSwapRequest.update({
      where: { id },
      data: {
        status: respondToSwapDto.status,
        adminNotes: respondToSwapDto.adminNotes,
        respondedAt: new Date(),
      },
      include: {
        requesterStaff: true,
        requesterAssignment: {
          include: {
            pattern: true,
          },
        },
        targetStaff: true,
        targetAssignment: {
          include: {
            pattern: true,
          },
        },
      },
    });

    log.info('Swap request status updated', { newStatus: updatedSwap.status });

    // If approved, execute the swap
    if (respondToSwapDto.status === SwapStatus.APPROVED) {
      await this.executeSwap(id, tenantId, userId);

      // Publish approved event
      await this.eventBus.publish(
        createEvent(EventType.SWAP_APPROVED, updatedSwap.id, tenantId, {
          requesterStaffName: updatedSwap.requesterStaff.name,
          targetStaffName: updatedSwap.targetStaff?.name,
        }, userId),
      );
    } else if (respondToSwapDto.status === SwapStatus.REJECTED) {
      // Publish rejected event
      await this.eventBus.publish(
        createEvent(EventType.SWAP_REJECTED, updatedSwap.id, tenantId, {
          requesterStaffName: updatedSwap.requesterStaff.name,
          reason: respondToSwapDto.adminNotes,
        }, userId),
      );
    }

    return updatedSwap;
  }

  async cancel(id: string, tenantId: string, userId: string) {
    const log = logger.child({ tenantId, swapRequestId: id, userId, action: 'cancel_swap' });

    const swapRequest = await this.findOne(id, tenantId);

    // Only requester can cancel
    const requesterStaff = await this.prisma.staff.findFirst({
      where: {
        id: swapRequest.requesterStaffId,
        userId,
      },
    });

    if (!requesterStaff) {
      log.warn('User is not the requester');
      throw new ForbiddenException('Only the requester can cancel this swap request');
    }

    // Can only cancel pending or staff-accepted swaps
    if (
      swapRequest.status !== SwapStatus.PENDING &&
      swapRequest.status !== SwapStatus.ACCEPTED_BY_STAFF
    ) {
      log.warn('Cannot cancel swap in current status', { status: swapRequest.status });
      throw new BadRequestException(`Cannot cancel swap with status ${swapRequest.status}`);
    }

    const cancelledSwap = await this.prisma.shiftSwapRequest.update({
      where: { id },
      data: { status: SwapStatus.CANCELLED },
      include: {
        requesterStaff: true,
        requesterAssignment: true,
      },
    });

    log.info('Swap request cancelled');

    return cancelledSwap;
  }

  private async executeSwap(id: string, tenantId: string, userId: string) {
    const log = logger.child({ tenantId, swapRequestId: id, action: 'execute_swap' });

    const swapRequest = await this.findOne(id, tenantId);

    if (!swapRequest.targetAssignmentId) {
      log.error('Cannot execute swap without target assignment');
      throw new BadRequestException('Cannot execute swap without target assignment');
    }

    // Swap the staff assignments
    await this.prisma.$transaction([
      this.prisma.shiftAssignment.update({
        where: { id: swapRequest.requesterAssignmentId },
        data: { staffId: swapRequest.targetStaffId! },
      }),
      this.prisma.shiftAssignment.update({
        where: { id: swapRequest.targetAssignmentId },
        data: { staffId: swapRequest.requesterStaffId },
      }),
      this.prisma.shiftSwapRequest.update({
        where: { id },
        data: {
          status: SwapStatus.COMPLETED,
          executedAt: new Date(),
        },
      }),
    ]);

    log.info('Shift swap executed successfully', {
      requesterStaffId: swapRequest.requesterStaffId,
      targetStaffId: swapRequest.targetStaffId,
    });

    // Publish completed event
    await this.eventBus.publish(
      createEvent(EventType.SWAP_COMPLETED, swapRequest.id, tenantId, {
        requesterStaffName: swapRequest.requesterStaff.name,
        targetStaffName: swapRequest.targetStaff?.name,
        swappedAssignments: [
          swapRequest.requesterAssignmentId,
          swapRequest.targetAssignmentId,
        ],
      }, userId),
    );
  }

  async getAvailableShiftsForSwap(assignmentId: string, tenantId: string) {
    const log = logger.child({ tenantId, assignmentId, action: 'get_available_shifts' });

    // Get the assignment they want to swap
    const assignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        id: assignmentId,
        staff: { tenantId },
      },
      include: {
        staff: true,
        pattern: true,
      },
    });

    if (!assignment) {
      log.warn('Assignment not found');
      throw new NotFoundException('Assignment not found');
    }

    // Find other staff with shifts on or after the same date
    // Exclude the requester's own shifts
    const availableShifts = await this.prisma.shiftAssignment.findMany({
      where: {
        staff: { tenantId },
        staffId: { not: assignment.staffId },
        date: { gte: assignment.date },
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          },
        },
        pattern: true,
      },
      orderBy: [{ date: 'asc' }, { staff: { name: 'asc' } }],
      take: 50, // Limit results
    });

    log.debug('Available shifts retrieved', { count: availableShifts.length });

    return availableShifts;
  }
}
