import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ExpenseStatus } from '../../../common/constants';
import { ExpenseApproval } from './expense-approval.entity';
import { User } from '../../users/entities/user.entity';

@Entity('expenses')
export class Expense extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ length: 100 })
  category: string; // MEDICAL_CAMP, BLANKET_PROCUREMENT, LOGISTICS, OFFICE, OTHER

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'BDT' })
  currency: string;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: string;

  @Column({ name: 'paid_to', length: 150 })
  paidTo: string;

  @Column({ name: 'receipt_url', type: 'varchar', length: 500, nullable: true })
  receiptUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: ExpenseStatus,
    default: ExpenseStatus.PENDING_APPROVAL,
  })
  status: ExpenseStatus;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User | null;

  @OneToMany(() => ExpenseApproval, (approval) => approval.expense, { cascade: true })
  approvals: ExpenseApproval[];
}
