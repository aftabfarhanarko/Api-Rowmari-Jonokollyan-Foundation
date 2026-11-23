import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ExpenseStatus } from '../../../common/constants';
import { Expense } from './expense.entity';
import { User } from '../../users/entities/user.entity';

@Entity('expense_approvals')
export class ExpenseApproval extends BaseEntity {
  @Index()
  @Column({ name: 'expense_id' })
  expenseId: string;

  @ManyToOne(() => Expense, (e) => e.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @Column({ name: 'reviewed_by_user_id' })
  reviewedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewedByUser: User;

  @Column({
    type: 'enum',
    enum: ExpenseStatus,
  })
  decision: ExpenseStatus; // APPROVED or REJECTED

  @Column({ type: 'text', nullable: true })
  remarks: string | null;
}
