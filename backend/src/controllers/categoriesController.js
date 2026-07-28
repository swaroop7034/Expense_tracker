import * as categoriesService from '../services/categoriesService.js';
import { success } from '../utils/apiResponse.js';

export async function getAllCategories(req, res, next) {
  try {
    const data = await categoriesService.getAllCategories();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}
