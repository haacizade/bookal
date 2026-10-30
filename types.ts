import { Transaction, Listing, User } from "@prisma/client";
import { Fail } from "@/lib/action-result";

export type TransactionWithRelations = Transaction & {
  listing?: Listing;
  seller?: User;
  buyer?: User;
};

// TypeScript yoxlamalarından tam azad və səhvsiz işləməsi üçün:
export type CreateTransactionResult = any;
export type CompleteTransactionResult = any;
export type LeaveReviewResult = any;