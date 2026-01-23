import crypto from 'crypto';
import User from '../models/User.model';

export async function generateReferralCode(): Promise<string> {
  let code: string;
  let exists = true;

  while (exists) {
    code = crypto.randomBytes(4).toString('hex');
    const user = await User.findOne({ referralCode: code });
    exists = !!user;
  }

  return code!;
}

