import * as settlementsService from '../services/settlementsService.js';
import { success } from '../utils/apiResponse.js';

export async function getSettlements(req, res, next) {
  try {
    const data = await settlementsService.getSettlements();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getSuggestedSettlements(req, res, next) {
  try {
    const data = await settlementsService.getSuggestedSettlements();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function createSettlement(req, res, next) {
  try {
    const data = await settlementsService.createSettlement(req.body);
    return success(res, data, null, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateSettlement(req, res, next) {
  try {
    const data = await settlementsService.updateSettlement(req.params.id, req.body);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function deleteSettlement(req, res, next) {
  try {
    await settlementsService.deleteSettlement(req.params.id);
    return success(res, { message: 'Settlement deleted successfully' });
  } catch (err) {
    next(err);
  }
}
