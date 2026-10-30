import { Transaction, Listing, User } from "@prisma/client";
import { Fail } from "@/lib/action-result";

export type TransactionWithRelations = Transaction & {
  listing?: Listing;
  seller?: User;
  buyer?: User;
};

// Bütün Server Action nəticə tipləri (heç bir build xəstasına səbəb olmayacaq şəkildə)
export type CreateTransactionResult = any;
export type CompleteTransactionResult = any;
export type LeaveReviewResult = any;
export type FetchWishlistResult = any;
export type ToggleWishlistResult = any;