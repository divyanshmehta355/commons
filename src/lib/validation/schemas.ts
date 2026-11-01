import { z } from 'zod';

export const createCommunitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional().default(''),
  visibility: z.enum(['public', 'private']),
  city: z.string().min(2, 'City is required').max(100),
  region: z.string().min(2, 'Region/State is required').max(100),
  joinCode: z.string().optional(),
  location: z.tuple([z.number(), z.number()]).optional(),
  boundary: z.array(z.array(z.tuple([z.number(), z.number()]))).optional(),
});

export const joinCommunitySchema = z.object({
  joinCode: z.string().optional(),
});

export const createResourceSchema = z.object({
  communityId: z.string().min(1, 'Community is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(3000).optional().default(''),
  category: z.enum([
    'Electronics',
    'Books',
    'Study materials',
    'Sports equipment',
    'Tools',
    'Furniture',
    'Kitchen appliances',
    'Clothing',
    'Travel equipment',
    'Event supplies',
    'Other'
  ]),
  condition: z.enum(['new', 'good', 'fair']),
  exchangeMode: z.enum(['free', 'rent', 'exchange', 'both']),
  pricePerDay: z.number().min(0).optional().default(0),
  currency: z.string().max(10).optional().default('INR'),
  pickupArea: z.string().max(200).optional().default(''),
  allowCrossCommunity: z.boolean().optional().default(true),
  imageUrl: z.string().url().or(z.literal('')).optional().default(''),
  location: z.tuple([z.number(), z.number()]).optional(),
});

export const updateResourceSchema = createResourceSchema.partial().extend({
  status: z.enum(['available', 'reserved', 'borrowed', 'paused', 'archived']).optional(),
});

export const createBorrowRequestSchema = z.object({
  resourceId: z.string().min(1, 'Resource is required'),
  startAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid start date required'),
  endAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid end date required'),
  exchangeMode: z.enum(['free', 'rent', 'exchange']),
  offeredResourceId: z.string().optional(),
  message: z.string().max(1000).optional().default(''),
});

export const createReviewSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID required').optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000).optional().default(''),
});

