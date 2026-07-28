import { getSimplificationBreakdown } from '../services/breakdownService.js';
import { success } from '../utils/apiResponse.js';

export const getBreakdown = async (req, res, next) => {
  try {
    const data = await getSimplificationBreakdown();
    return success(res, data);
  } catch (error) {
    next(error);
  }
};
