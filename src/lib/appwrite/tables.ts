import { getAdminClient, Query, ID } from './server';

export interface CommunityDoc {
  $id: string;
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private';
  city: string;
  region: string;
  joinCodeHash?: string;
  createdBy: string;
  status: 'active' | 'archived';
  location?: [number, number]; // [longitude, latitude]
  boundary?: number[][][]; // GeoJSON Polygon coordinates
  createdAt: string;
}

export interface MemberDoc {
  $id: string;
  communityId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active' | 'suspended';
  displayName: string;
  joinedAt: string;
}

export interface ResourceDoc {
  $id: string;
  communityId: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  condition: 'new' | 'good' | 'fair';
  exchangeMode: 'free' | 'rent' | 'exchange' | 'both';
  pricePerDay: number;
  currency: string;
  status: 'available' | 'reserved' | 'borrowed' | 'paused' | 'archived';
  pickupArea: string;
  allowCrossCommunity: boolean;
  imageUrl?: string;
  location?: [number, number]; // [longitude, latitude]
  createdAt: string;
  updatedAt: string;
}

export interface BorrowRequestDoc {
  $id: string;
  resourceId: string;
  communityId: string;
  borrowerId: string;
  ownerId: string;
  startAt: string;
  endAt: string;
  exchangeMode: string;
  offeredResourceId?: string;
  quotedTotal: number;
  currency: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDoc {
  $id: string;
  requestId: string;
  resourceId: string;
  ownerId: string;
  borrowerId: string;
  handoverAt?: string;
  dueAt: string;
  returnedAt?: string;
  status: 'awaiting_handover' | 'borrowed' | 'returned' | 'disputed';
  ownerConfirmed: boolean;
  borrowerConfirmed: boolean;
  handoverTokenHash?: string;
  handoverExpiresAt?: string;
  createdAt: string;
}

export interface ReviewDoc {
  $id: string;
  transactionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ActivityLogDoc {
  $id: string;
  communityId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata: string;
  createdAt: string;
}

export interface AvailabilityRuleDoc {
  $id: string;
  resourceId: string;
  startAt: string;
  endAt: string;
  ruleType: 'blackout';
  createdAt: string;
}

export interface WishlistDoc {
  $id: string;
  userId: string;
  resourceId: string;
  createdAt: string;
}

export interface NotificationDoc {
  $id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ResourceReportDoc {
  $id: string;
  reporterId: string;
  resourceId: string;
  communityId: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AISuggestionDoc {
  $id: string;
  userId: string;
  communityId: string;
  suggestionType: string;
  inputSummary: string;
  result: string;
  status: string;
  createdAt: string;
}

export interface ExchangeOfferDoc {
  $id: string;
  proposerId: string;
  ownerId: string;
  targetResourceId: string;
  offeredResourceId: string;
  communityId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
}

export interface WaitlistEntryDoc {
  $id: string;
  userId: string;
  resourceId: string;
  communityId: string;
  status: 'waiting' | 'notified' | 'cancelled';
  createdAt: string;
}

export interface ResourceBundleDoc {
  $id: string;
  communityId: string;
  creatorId: string;
  title: string;
  description: string;
  resourceIds: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface CommunityChallengeDoc {
  $id: string;
  communityId: string;
  title: string;
  description: string;
  targetShares: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
}

export const dbService = {
  // Communities
  async createCommunity(data: Omit<CommunityDoc, '$id'>): Promise<CommunityDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'communities',
      rowId,
      data,
    });
    return res as unknown as CommunityDoc;
  },

  async getCommunityById(id: string): Promise<CommunityDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    try {
      const res = await tablesDb.getRow({
        databaseId,
        tableId: 'communities',
        rowId: id,
      });
      return res as unknown as CommunityDoc;
    } catch {
      return null;
    }
  },

  async getCommunityBySlug(slug: string): Promise<CommunityDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'communities',
      queries: [Query.equal('slug', slug), Query.limit(1)],
    });
    return (res.rows[0] as unknown as CommunityDoc) || null;
  },

  async listCommunities(queries: string[] = []): Promise<CommunityDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'communities',
      queries: [Query.orderDesc('createdAt'), ...queries],
    });
    return res.rows as unknown as CommunityDoc[];
  },

  // Members
  async addMember(data: Omit<MemberDoc, '$id'>): Promise<MemberDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'members',
      rowId,
      data,
    });
    return res as unknown as MemberDoc;
  },

  async getMember(communityId: string, userId: string): Promise<MemberDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'members',
      queries: [
        Query.equal('communityId', communityId),
        Query.equal('userId', userId),
        Query.limit(1),
      ],
    });
    return (res.rows[0] as unknown as MemberDoc) || null;
  },

  async listMembers(communityId: string): Promise<MemberDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'members',
      queries: [Query.equal('communityId', communityId), Query.limit(100)],
    });
    return res.rows as unknown as MemberDoc[];
  },

  async listUserMemberships(userId: string): Promise<MemberDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'members',
      queries: [Query.equal('userId', userId), Query.equal('status', 'active'), Query.limit(50)],
    });
    return res.rows as unknown as MemberDoc[];
  },

  async updateMember(id: string, data: Partial<MemberDoc>): Promise<MemberDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.updateRow({
      databaseId,
      tableId: 'members',
      rowId: id,
      data,
    });
    return res as unknown as MemberDoc;
  },

  // Resources
  async createResource(data: Omit<ResourceDoc, '$id'>): Promise<ResourceDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'resources',
      rowId,
      data,
    });
    return res as unknown as ResourceDoc;
  },

  async getResourceById(id: string): Promise<ResourceDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    try {
      const res = await tablesDb.getRow({
        databaseId,
        tableId: 'resources',
        rowId: id,
      });
      return res as unknown as ResourceDoc;
    } catch {
      return null;
    }
  },

  async updateResource(id: string, data: Partial<ResourceDoc>): Promise<ResourceDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.updateRow({
      databaseId,
      tableId: 'resources',
      rowId: id,
      data,
    });
    return res as unknown as ResourceDoc;
  },

  async listResources(queries: string[] = []): Promise<ResourceDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'resources',
      queries: [Query.orderDesc('createdAt'), Query.limit(100), ...queries],
    });
    return res.rows as unknown as ResourceDoc[];
  },

  // Borrow Requests
  async createBorrowRequest(data: Omit<BorrowRequestDoc, '$id'>): Promise<BorrowRequestDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'borrow_requests',
      rowId,
      data,
    });
    return res as unknown as BorrowRequestDoc;
  },

  async getBorrowRequestById(id: string): Promise<BorrowRequestDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    try {
      const res = await tablesDb.getRow({
        databaseId,
        tableId: 'borrow_requests',
        rowId: id,
      });
      return res as unknown as BorrowRequestDoc;
    } catch {
      return null;
    }
  },

  async updateBorrowRequest(id: string, data: Partial<BorrowRequestDoc>): Promise<BorrowRequestDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.updateRow({
      databaseId,
      tableId: 'borrow_requests',
      rowId: id,
      data,
    });
    return res as unknown as BorrowRequestDoc;
  },

  async listBorrowRequests(queries: string[] = []): Promise<BorrowRequestDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'borrow_requests',
      queries: [Query.orderDesc('createdAt'), Query.limit(100), ...queries],
    });
    return res.rows as unknown as BorrowRequestDoc[];
  },

  // Transactions
  async createTransaction(data: Omit<TransactionDoc, '$id'>): Promise<TransactionDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'transactions',
      rowId,
      data,
    });
    return res as unknown as TransactionDoc;
  },

  async getTransactionById(id: string): Promise<TransactionDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    try {
      const res = await tablesDb.getRow({
        databaseId,
        tableId: 'transactions',
        rowId: id,
      });
      return res as unknown as TransactionDoc;
    } catch {
      return null;
    }
  },

  async getTransactionByRequestId(requestId: string): Promise<TransactionDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'transactions',
      queries: [Query.equal('requestId', requestId), Query.limit(1)],
    });
    return (res.rows[0] as unknown as TransactionDoc) || null;
  },

  async updateTransaction(id: string, data: Partial<TransactionDoc>): Promise<TransactionDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.updateRow({
      databaseId,
      tableId: 'transactions',
      rowId: id,
      data,
    });
    return res as unknown as TransactionDoc;
  },

  async listTransactions(queries: string[] = []): Promise<TransactionDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'transactions',
      queries: [Query.orderDesc('createdAt'), Query.limit(100), ...queries],
    });
    return res.rows as unknown as TransactionDoc[];
  },

  // Reviews
  async createReview(data: Omit<ReviewDoc, '$id'>): Promise<ReviewDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'reviews',
      rowId,
      data,
    });
    return res as unknown as ReviewDoc;
  },

  async listReviewsForUser(userId: string): Promise<ReviewDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'reviews',
      queries: [Query.equal('revieweeId', userId), Query.orderDesc('createdAt'), Query.limit(50)],
    });
    return res.rows as unknown as ReviewDoc[];
  },

  async getReviewByTransactionAndReviewer(transactionId: string, reviewerId: string): Promise<ReviewDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'reviews',
      queries: [
        Query.equal('transactionId', transactionId),
        Query.equal('reviewerId', reviewerId),
        Query.limit(1),
      ],
    });
    return (res.rows[0] as unknown as ReviewDoc) || null;
  },

  // Activity Logs
  async logActivity(data: Omit<ActivityLogDoc, '$id'>): Promise<ActivityLogDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'activity_logs',
      rowId,
      data,
    });
    return res as unknown as ActivityLogDoc;
  },

  async listCommunityActivity(communityId: string, limit = 20): Promise<ActivityLogDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'activity_logs',
      queries: [Query.equal('communityId', communityId), Query.orderDesc('createdAt'), Query.limit(limit)],
    });
    return res.rows as unknown as ActivityLogDoc[];
  },

  // AI Suggestions Cache
  async saveAiSuggestion(data: Omit<AISuggestionDoc, '$id'>): Promise<AISuggestionDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'ai_suggestions',
      rowId,
      data,
    });
    return res as unknown as AISuggestionDoc;
  },

  // Availability Rules
  async createAvailabilityRule(data: Omit<AvailabilityRuleDoc, '$id'>): Promise<AvailabilityRuleDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'availability_rules',
      rowId,
      data,
    });
    return res as unknown as AvailabilityRuleDoc;
  },

  async listAvailabilityRules(resourceId: string): Promise<AvailabilityRuleDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'availability_rules',
      queries: [Query.equal('resourceId', resourceId), Query.orderAsc('startAt'), Query.limit(100)],
    });
    return res.rows as unknown as AvailabilityRuleDoc[];
  },

  async deleteAvailabilityRule(id: string): Promise<boolean> {
    const { tablesDb, databaseId } = getAdminClient();
    await tablesDb.deleteRow({
      databaseId,
      tableId: 'availability_rules',
      rowId: id,
    });
    return true;
  },

  // Wishlists
  async addToWishlist(userId: string, resourceId: string): Promise<WishlistDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'wishlists',
      rowId,
      data: {
        userId,
        resourceId,
        createdAt: new Date().toISOString(),
      },
    });
    return res as unknown as WishlistDoc;
  },

  async removeFromWishlist(id: string): Promise<boolean> {
    const { tablesDb, databaseId } = getAdminClient();
    await tablesDb.deleteRow({
      databaseId,
      tableId: 'wishlists',
      rowId: id,
    });
    return true;
  },

  async getWishlistEntry(userId: string, resourceId: string): Promise<WishlistDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'wishlists',
      queries: [
        Query.equal('userId', userId),
        Query.equal('resourceId', resourceId),
        Query.limit(1),
      ],
    });
    return (res.rows[0] as unknown as WishlistDoc) || null;
  },

  async listWishlistsByUser(userId: string): Promise<WishlistDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'wishlists',
      queries: [Query.equal('userId', userId), Query.orderDesc('createdAt'), Query.limit(100)],
    });
    return res.rows as unknown as WishlistDoc[];
  },

  // Notifications
  async createNotification(data: Omit<NotificationDoc, '$id'>): Promise<NotificationDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'notifications',
      rowId,
      data,
    });
    return res as unknown as NotificationDoc;
  },

  async listNotificationsByUser(userId: string, limit = 50): Promise<NotificationDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'notifications',
      queries: [Query.equal('userId', userId), Query.orderDesc('createdAt'), Query.limit(limit)],
    });
    return res.rows as unknown as NotificationDoc[];
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'notifications',
      queries: [Query.equal('userId', userId), Query.equal('isRead', false), Query.limit(100)],
    });
    return res.total ?? res.rows.length;
  },

  async markNotificationAsRead(id: string): Promise<NotificationDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.updateRow({
      databaseId,
      tableId: 'notifications',
      rowId: id,
      data: { isRead: true },
    });
    return res as unknown as NotificationDoc;
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { tablesDb, databaseId } = getAdminClient();
    const unread = await tablesDb.listRows({
      databaseId,
      tableId: 'notifications',
      queries: [Query.equal('userId', userId), Query.equal('isRead', false), Query.limit(100)],
    });
    for (const row of unread.rows) {
      await tablesDb.updateRow({
        databaseId,
        tableId: 'notifications',
        rowId: row.$id,
        data: { isRead: true },
      });
    }
  },

  // Resource Reports
  async createResourceReport(data: Omit<ResourceReportDoc, '$id'>): Promise<ResourceReportDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'resource_reports',
      rowId,
      data,
    });
    return res as unknown as ResourceReportDoc;
  },

  async listReportsByCommunity(communityId: string): Promise<ResourceReportDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'resource_reports',
      queries: [Query.equal('communityId', communityId), Query.orderDesc('createdAt'), Query.limit(100)],
    });
    return res.rows as unknown as ResourceReportDoc[];
  },

  async getResourceReportById(id: string): Promise<ResourceReportDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    try {
      const res = await tablesDb.getRow({
        databaseId,
        tableId: 'resource_reports',
        rowId: id,
      });
      return res as unknown as ResourceReportDoc;
    } catch {
      return null;
    }
  },

  async updateResourceReport(id: string, data: Partial<ResourceReportDoc>): Promise<ResourceReportDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.updateRow({
      databaseId,
      tableId: 'resource_reports',
      rowId: id,
      data,
    });
    return res as unknown as ResourceReportDoc;
  },

  // Exchange Offers
  async createExchangeOffer(data: Omit<ExchangeOfferDoc, '$id'>): Promise<ExchangeOfferDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'exchange_offers',
      rowId,
      data,
    });
    return res as unknown as ExchangeOfferDoc;
  },

  async getExchangeOfferById(id: string): Promise<ExchangeOfferDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    try {
      const res = await tablesDb.getRow({
        databaseId,
        tableId: 'exchange_offers',
        rowId: id,
      });
      return res as unknown as ExchangeOfferDoc;
    } catch {
      return null;
    }
  },

  async listExchangeOffersForUser(userId: string): Promise<ExchangeOfferDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const [asProposer, asOwner] = await Promise.all([
      tablesDb.listRows({
        databaseId,
        tableId: 'exchange_offers',
        queries: [Query.equal('proposerId', userId), Query.orderDesc('createdAt'), Query.limit(50)],
      }),
      tablesDb.listRows({
        databaseId,
        tableId: 'exchange_offers',
        queries: [Query.equal('ownerId', userId), Query.orderDesc('createdAt'), Query.limit(50)],
      }),
    ]);
    const combined = [...asProposer.rows, ...asOwner.rows] as unknown as ExchangeOfferDoc[];
    const map = new Map<string, ExchangeOfferDoc>();
    for (const item of combined) {
      map.set(item.$id, item);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async updateExchangeOffer(id: string, data: Partial<ExchangeOfferDoc>): Promise<ExchangeOfferDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.updateRow({
      databaseId,
      tableId: 'exchange_offers',
      rowId: id,
      data,
    });
    return res as unknown as ExchangeOfferDoc;
  },

  // Waitlist Entries
  async createWaitlistEntry(data: Omit<WaitlistEntryDoc, '$id'>): Promise<WaitlistEntryDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'waitlist_entries',
      rowId,
      data,
    });
    return res as unknown as WaitlistEntryDoc;
  },

  async getWaitlistEntry(resourceId: string, userId: string): Promise<WaitlistEntryDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'waitlist_entries',
      queries: [
        Query.equal('resourceId', resourceId),
        Query.equal('userId', userId),
        Query.equal('status', 'waiting'),
        Query.limit(1),
      ],
    });
    return (res.rows[0] as unknown as WaitlistEntryDoc) || null;
  },

  async listWaitlistByResource(resourceId: string): Promise<WaitlistEntryDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'waitlist_entries',
      queries: [Query.equal('resourceId', resourceId), Query.orderAsc('createdAt'), Query.limit(100)],
    });
    return res.rows as unknown as WaitlistEntryDoc[];
  },

  async listWaitlistByUser(userId: string): Promise<WaitlistEntryDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'waitlist_entries',
      queries: [Query.equal('userId', userId), Query.orderDesc('createdAt'), Query.limit(50)],
    });
    return res.rows as unknown as WaitlistEntryDoc[];
  },

  async deleteWaitlistEntry(id: string): Promise<void> {
    const { tablesDb, databaseId } = getAdminClient();
    await tablesDb.deleteRow({
      databaseId,
      tableId: 'waitlist_entries',
      rowId: id,
    });
  },

  async updateWaitlistEntry(id: string, data: Partial<WaitlistEntryDoc>): Promise<WaitlistEntryDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.updateRow({
      databaseId,
      tableId: 'waitlist_entries',
      rowId: id,
      data,
    });
    return res as unknown as WaitlistEntryDoc;
  },

  // Resource Bundles
  async createBundle(data: Omit<ResourceBundleDoc, '$id'>): Promise<ResourceBundleDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'resource_bundles',
      rowId,
      data,
    });
    return res as unknown as ResourceBundleDoc;
  },

  async getBundleById(id: string): Promise<ResourceBundleDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    try {
      const res = await tablesDb.getRow({
        databaseId,
        tableId: 'resource_bundles',
        rowId: id,
      });
      return res as unknown as ResourceBundleDoc;
    } catch {
      return null;
    }
  },

  async listBundlesByCommunity(communityId: string): Promise<ResourceBundleDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'resource_bundles',
      queries: [
        Query.equal('communityId', communityId),
        Query.equal('status', 'active'),
        Query.orderDesc('createdAt'),
        Query.limit(50),
      ],
    });
    return res.rows as unknown as ResourceBundleDoc[];
  },

  async updateBundle(id: string, data: Partial<ResourceBundleDoc>): Promise<ResourceBundleDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.updateRow({
      databaseId,
      tableId: 'resource_bundles',
      rowId: id,
      data,
    });
    return res as unknown as ResourceBundleDoc;
  },

  // Community Challenges
  async createChallenge(data: Omit<CommunityChallengeDoc, '$id'>): Promise<CommunityChallengeDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const rowId = ID.unique();
    const res = await tablesDb.createRow({
      databaseId,
      tableId: 'community_challenges',
      rowId,
      data,
    });
    return res as unknown as CommunityChallengeDoc;
  },

  async getChallengeById(id: string): Promise<CommunityChallengeDoc | null> {
    const { tablesDb, databaseId } = getAdminClient();
    try {
      const res = await tablesDb.getRow({
        databaseId,
        tableId: 'community_challenges',
        rowId: id,
      });
      return res as unknown as CommunityChallengeDoc;
    } catch {
      return null;
    }
  },

  async listChallengesByCommunity(communityId: string): Promise<CommunityChallengeDoc[]> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.listRows({
      databaseId,
      tableId: 'community_challenges',
      queries: [
        Query.equal('communityId', communityId),
        Query.orderDesc('createdAt'),
        Query.limit(50),
      ],
    });
    return res.rows as unknown as CommunityChallengeDoc[];
  },

  async updateChallenge(id: string, data: Partial<CommunityChallengeDoc>): Promise<CommunityChallengeDoc> {
    const { tablesDb, databaseId } = getAdminClient();
    const res = await tablesDb.updateRow({
      databaseId,
      tableId: 'community_challenges',
      rowId: id,
      data,
    });
    return res as unknown as CommunityChallengeDoc;
  },
};

