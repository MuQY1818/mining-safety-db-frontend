// AI问答相关类型定义

// 聊天消息类型
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokensUsed?: number;
  modelName?: string;
  responseTime?: number;
  confidenceScore?: number;
  relatedDocuments?: RelatedDocument[];
  metadata?: MessageMetadata;
}

// 相关文档类型
export interface RelatedDocument {
  id: string;
  title: string;
  relevanceScore: number;
}

// 消息元数据类型
export interface MessageMetadata {
  sources?: string[];
  searchKeywords?: string[];
  [key: string]: any;
}

// 聊天会话类型
export interface ChatSession {
  id: string;
  userId: number;
  title: string;
  description?: string;
  status: 'active' | 'archived' | 'deleted';
  messageCount: number;
  totalTokens: number;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

// 会话更新参数类型
export interface SessionUpdateParams {
  title?: string;
  description?: string;
  status?: 'active' | 'archived' | 'deleted';
}

// 会话查询参数类型
export interface SessionQueryParams {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'archived' | 'deleted';
  sortBy?: 'createdAt' | 'updatedAt' | 'lastMessageAt' | 'messageCount';
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
}

// AI API请求类型
export interface AIRequest {
  message: string;
  sessionId: string;
  stream?: boolean;
}

// AI API响应类型
export interface AIResponse {
  content: string;
  sessionId: string;
  messageId: string;
  relatedItems?: number[];
}

// 流式响应类型
export interface StreamResponse {
  content: string;
  done: boolean;
}

// 消息反馈类型
export interface MessageFeedback {
  id: string;
  messageId: string;
  userId: number;
  feedbackType: 'like' | 'dislike' | 'report';
  feedbackReason?: string;
  feedbackComment?: string;
  createdAt: Date;
}

// 消息反馈提交类型
export interface FeedbackSubmission {
  feedbackType: 'like' | 'dislike' | 'report';
  feedbackReason?: string;
  feedbackComment?: string;
}

// AI对话统计类型
export interface ChatStatistics {
  overview: {
    totalSessions: number;
    totalMessages: number;
    totalTokens: number;
    averageMessagesPerSession: number;
    averageTokensPerMessage: number;
    activeUsers: number;
  };
  trends: {
    dailyStats: DailyStats[];
  };
  feedback: {
    totalFeedback: number;
    likes: number;
    dislikes: number;
    reports: number;
    likeRate: number;
  };
  popularTopics: TopicStats[];
  modelUsage: Record<string, ModelUsageStats>;
}

// 每日统计类型
export interface DailyStats {
  date: string;
  sessions: number;
  messages: number;
  tokens: number;
  users: number;
}

// 话题统计类型
export interface TopicStats {
  topic: string;
  count: number;
  percentage: number;
}

// 模型使用统计类型
export interface ModelUsageStats {
  count: number;
  percentage: number;
  averageTokens: number;
}

// 用户建议反馈相关类型定义

// 建议类型枚举
export enum FeedbackType {
  BUG_REPORT = 'BUG_REPORT',           // 🐛 问题反馈
  FEATURE_REQUEST = 'FEATURE_REQUEST', // ⭐ 功能建议
  CONTENT_SUGGESTION = 'CONTENT_SUGGESTION', // 📝 内容建议
  IMPROVEMENT = 'IMPROVEMENT',         // 🔧 改进建议
  GENERAL = 'GENERAL'                  // 💬 一般意见
}

// 处理状态枚举
export enum FeedbackStatus {
  PENDING = 'PENDING',       // 📋 待处理
  IN_PROGRESS = 'IN_PROGRESS', // 🔄 处理中
  RESOLVED = 'RESOLVED',     // ✅ 已解决
  REJECTED = 'REJECTED'      // ❌ 已拒绝
}

// 优先级枚举
export enum Priority {
  LOW = 'LOW',         // 🟢 低优先级
  MEDIUM = 'MEDIUM',   // 🟡 中等优先级
  HIGH = 'HIGH',       // 🟠 高优先级
  URGENT = 'URGENT'    // 🔴 紧急
}

// 用户建议数据类型
export interface UserFeedback {
  id: number;
  userId: number;
  type: FeedbackType;
  title: string;           // 建议标题
  content: string;         // 建议内容
  priority: Priority;      // 优先级
  status: FeedbackStatus;  // 处理状态
  attachments?: string[];  // 附件URL列表
  adminReply?: string;     // 管理员回复
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;     // 解决时间
}

// 建议提交表单类型
export interface FeedbackForm {
  type: FeedbackType;
  title: string;
  content: string;
  priority: Priority;
  attachments?: File[];
}

// 建议查询参数类型
export interface FeedbackQuery {
  type?: FeedbackType;
  status?: FeedbackStatus;
  priority?: Priority;
  userId?: number;
  page: number;
  pageSize: number;
  sortBy?: 'createdAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// 建议统计类型
export interface FeedbackStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  byType: Record<FeedbackType, number>;
  byPriority: Record<Priority, number>;
}
