import * as dashboardService from '../services/dashboardService.js';
import { success } from '../utils/apiResponse.js';

export async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.getDashboardData();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}
