export const validateTransactionId = (transactionId: string): boolean => {
  // Minimum 4 characters required
  return transactionId.trim().length >= 4;
};

export const validateAmount = (amount: string): { valid: boolean; value?: number; error?: string } => {
  // Accept formats: "100" or "100 Birr" (with space in the middle)
  // Remove "Birr" if present (case insensitive, with optional spaces)
  const cleaned = amount.trim().replace(/\s*birr\s*$/i, '').trim();
  
  // Validate format: should be number only or number followed by optional "Birr"
  // Check if it matches: number (with optional "Birr" at the end)
  const amountPattern = /^(\d+(?:\.\d+)?)\s*(?:birr)?$/i;
  const match = cleaned.match(amountPattern);
  
  if (!match) {
    return { valid: false, error: 'Invalid amount. Please enter a valid number (e.g., 100 or 100 Birr).' };
  }
  
  const parsed = parseFloat(match[1]);
  
  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'Invalid amount. Please enter a valid number greater than 0.' };
  }
  
  return { valid: true, value: parsed };
};

export const normalizePhoneNumber = (phoneNumber: string): string => {
  return phoneNumber?.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
};

export const validateWithdrawAmount = (
  amount: string,
  currentBalance: number
): { valid: boolean; value?: number; error?: string } => {
  const amountValidation = validateAmount(amount);
  if (!amountValidation.valid) {
    return amountValidation;
  }

  const parsed = amountValidation.value!;
  const MIN_WITHDRAW = 50;
  const MIN_REMAINING = 10;

  if (parsed < MIN_WITHDRAW) {
    return {
      valid: false,
      error: `❌ Minimum withdrawal amount is ${MIN_WITHDRAW} Birr.`,
    };
  }

  if (currentBalance - parsed < MIN_REMAINING) {
    const maxWithdraw = currentBalance - MIN_REMAINING;
    return {
      valid: false,
      error: `❌ You must leave at least ${MIN_REMAINING} Birr in your account.\n\n` +
        `Maximum withdrawal: ${maxWithdraw} Birr\n` +
        `Your balance: ${currentBalance} Birr`,
    };
  }

  if (parsed > currentBalance) {
    return {
      valid: false,
      error: `❌ Insufficient balance!\n\n` +
        `Your current balance: ${currentBalance} Birr\n` +
        `Requested amount: ${parsed} Birr`,
    };
  }

  return { valid: true, value: parsed };
};

export const validateAccountType = (text: string): 'Telebirr' | 'CBE' | null => {
  const normalized = text.trim().toLowerCase();
  if (normalized === 'telebirr' || normalized === '1') {
    return 'Telebirr';
  }
  if (normalized === 'cbe' || normalized === '2') {
    return 'CBE';
  }
  return null;
};

export const validateAccountNumber = (accountNumber: string): { valid: boolean; error?: string } => {
  const trimmed = accountNumber.trim();
  if (!trimmed || trimmed.length === 0) {
    return { valid: false, error: '❌ Account number cannot be empty. Please enter a valid account number.' };
  }
  if (trimmed.length < 4) {
    return { valid: false, error: '❌ Account number must be at least 4 characters long.' };
  }
  return { valid: true };
};

