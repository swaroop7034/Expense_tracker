import * as membersService from '../services/membersService.js';
import { success } from '../utils/apiResponse.js';

export async function getAllMembers(req, res, next) {
  try {
    const data = await membersService.getAllMembers();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getMemberById(req, res, next) {
  try {
    const data = await membersService.getMemberById(req.params.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getMemberDetails(req, res, next) {
  try {
    const data = await membersService.getMemberDetails(req.params.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function createMember(req, res, next) {
  try {
    const data = await membersService.createMember(req.body);
    return success(res, data, null, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateMember(req, res, next) {
  try {
    const data = await membersService.updateMember(req.params.id, req.body);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function deleteMember(req, res, next) {
  try {
    await membersService.deleteMember(req.params.id);
    return success(res, { message: 'Member deleted successfully' });
  } catch (err) {
    next(err);
  }
}
