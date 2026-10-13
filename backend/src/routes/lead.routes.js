import { Router } from 'express';

import {
  createLead,
  getLead,
  getLeadSummary,
  listLeads,
  updateLead
} from '../controllers/lead.controller.js';

import { authenticate } from '../middlewares/auth.js';

export const leadRouter = Router();

leadRouter.use(authenticate);
leadRouter.get('/summary', getLeadSummary);
leadRouter.route('/').get(listLeads).post(createLead);
leadRouter.route('/:id').get(getLead).patch(updateLead);
