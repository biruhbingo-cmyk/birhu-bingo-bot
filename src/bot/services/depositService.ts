export interface PendingDeposit {
  amount: number;
  transactionType: 'Telebirr' | 'CBE';
}

class DepositService {
  private pendingDeposits = new Map<number, PendingDeposit>();

  setPendingDeposit(chatId: number, deposit: PendingDeposit) {
    this.pendingDeposits.set(chatId, deposit);
  }

  getPendingDeposit(chatId: number): PendingDeposit | undefined {
    return this.pendingDeposits.get(chatId);
  }

  clearPendingDeposit(chatId: number) {
    this.pendingDeposits.delete(chatId);
  }
}

export const depositService = new DepositService();

