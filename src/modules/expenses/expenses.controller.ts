import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, ReviewExpenseDto } from './dto/expense.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { PERMISSION_KEYS, ExpenseStatus } from '../../common/constants';

@ApiTags('Expenses & Financial Accountability')
@Controller('admin/expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @RequirePermissions(PERMISSION_KEYS.EXPENSES_CREATE)
  @ApiOperation({ summary: 'Record a foundation operational expense' })
  async create(
    @Body() dto: CreateExpenseDto,
    @CurrentUser('id') staffUserId: string,
  ) {
    return this.expensesService.create(dto, staffUserId);
  }

  @Get()
  @RequirePermissions(PERMISSION_KEYS.DONATIONS_VIEW)
  @ApiOperation({ summary: 'List expenses with status filter' })
  @ApiQuery({ name: 'status', enum: ExpenseStatus, required: false })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: ExpenseStatus,
  ) {
    return this.expensesService.findAll(query, status);
  }

  @Get(':id')
  @RequirePermissions(PERMISSION_KEYS.DONATIONS_VIEW)
  @ApiOperation({ summary: 'Get details of an expense and its approval audit trail' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.findById(id);
  }

  @Patch(':id/review')
  @RequirePermissions(PERMISSION_KEYS.EXPENSES_APPROVE)
  @AuditLog({ action: 'REVIEW_EXPENSE_APPROVAL', entityType: 'Expense' })
  @ApiOperation({ summary: 'Approve or reject expense entry (Finance Lead only)' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewExpenseDto,
    @CurrentUser('id') reviewerUserId: string,
  ) {
    return this.expensesService.review(id, dto, reviewerUserId);
  }
}
