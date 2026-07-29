import { getCategoryAnalytics } from '../services/analyticsService.js';
import { success } from '../utils/apiResponse.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const data = await getCategoryAnalytics();
    return success(res, data);
  } catch (error) {
    next(error);
  }
};
