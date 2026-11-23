import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseApproval } from './entities/expense-approval.entity';
import { CreateExpenseDto, ReviewExpenseDto } from './dto/expense.dto';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { ExpenseStatus } from '../../common/constants';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseApproval)
    private readonly approvalRepo: Repository<ExpenseApproval>,
  ) {}

  async create(dto: CreateExpenseDto, staffUserId: string): Promise<Expense> {
    const expense = this.expenseRepo.create({
      title: dto.title,
      category: dto.category,
      amount: dto.amount,
      currency: 'BDT',
      expenseDate: dto.expenseDate,
      paidTo: dto.paidTo,
      receiptUrl: dto.receiptUrl || null,
      description: dto.description || null,
      status: ExpenseStatus.PENDING_APPROVAL,
      createdByUserId: staffUserId,
    });

    return this.expenseRepo.save(expense);
  }

  async findAll(query: PaginationQueryDto, status?: ExpenseStatus): Promise<PaginatedResult<Expense>> {
    const qb = this.expenseRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.createdByUser', 'creator')
      .leftJoinAndSelect('e.approvals', 'approvals')
      .leftJoinAndSelect('approvals.reviewedByUser', 'reviewer')
      .orderBy('e.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (status) {
      qb.andWhere('e.status = :status', { status });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<Expense> {
    const expense = await this.expenseRepo.findOne({
      where: { id },
      relations: ['createdByUser', 'approvals', 'approvals.reviewedByUser'],
    });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found.`);
    }
    return expense;
  }

  async review(expenseId: string, dto: ReviewExpenseDto, reviewerUserId: string): Promise<Expense> {
    const expense = await this.findById(expenseId);

    if (expense.status !== ExpenseStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot review expense with status '${expense.status}'`);
    }

    expense.status = dto.decision;
    await this.expenseRepo.save(expense);

    const approval = this.approvalRepo.create({
      expenseId: expense.id,
      reviewedByUserId: reviewerUserId,
      decision: dto.decision,
      remarks: dto.remarks || null,
    });
    await this.approvalRepo.save(approval);

    return this.findById(expenseId);
  }
}
