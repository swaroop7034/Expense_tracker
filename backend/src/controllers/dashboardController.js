import * as balanceService from '../services/balanceService.js';
import { success } from '../utils/apiResponse.js';

export async function getDashboard(req, res, next) {
  try {
    const balances = await balanceService.calculateBalances();
    
    // The dashboard could also include recent expenses or settlements here,
    // but for now we'll just return the balances.
    // The frontend can fetch recent expenses separately if needed.
    
    return success(res, { balances });
  } catch (err) {
    next(err);
  }
}
