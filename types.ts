import { Transaction, Listing, User } from "@prisma/client";
import { Fail } from "@/lib/action-result";

export type TransactionWithRelations = Transaction & {
  listing?: Listing;
  seller?: User;
  buyer?: User;
};

export type CreateTransactionResult = 
  | { success: true; transaction?: TransactionWithRelations; [key: string]: any }
  | Fail;

export type CompleteTransactionResult = 
  | { success: true; transaction?: TransactionWithRelations; [key: string]: any }
  | Fail;

export type LeaveReviewResult = 
  | { success: true; review?: any; [key: string]: any }
  | Fail;