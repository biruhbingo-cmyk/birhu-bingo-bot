export interface PendingWithdraw {
  amount: number;
  accountType?: 'Telebirr' | 'CBE';
  accountNumber?: string;
}

class WithdrawService {
  private pendingWithdraws = new Map<number, PendingWithdraw>();

  setPendingWithdraw(chatId: number, withdraw: PendingWithdraw) {
    this.pendingWithdraws.set(chatId, withdraw);
  }

  getPendingWithdraw(chatId: number): PendingWithdraw | undefined {
    return this.pendingWithdraws.get(chatId);
  }

  clearPendingWithdraw(chatId: number) {
    this.pendingWithdraws.delete(chatId);
  }
}

export const withdrawService = new WithdrawService();

