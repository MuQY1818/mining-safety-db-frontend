// 用户建议反馈相关类型定义

// 建议类型 - 匹配后端API文档
export type FeedbackType = 
  | 'bug'        // 错误报告
  | 'feature'    // 功能建议
  | 'improvement' // 改进建议
  | 'other';     // 其他

// 建议优先级
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'urgent';

// 建议状态 - 匹配后端API文档
export type FeedbackStatus = 
  | 'pending'   // 待处理
  | 'resolved'  // 已处理
  | 'closed';   // 已关闭

// 用户建议接口
export interface UserFeedback {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  userEmail?: string;
  userName?: string;
  userContact?: string;
  attachments?: string[]; // 附件URL列表
  tags?: string[];
  adminReply?: string;
  adminRepliedAt?: string;
  adminRepliedBy?: string;
  createdAt: string;
  updatedAt: string;
  upvotes?: number; // 点赞数
  downvotes?: number; // 点踩数
}

// 建议提交表单数据
export interface FeedbackFormData {
  title: string;
  description: string;
  type: FeedbackType;
  priority: FeedbackPriority;
  userEmail?: string;
  userName?: string;
  userContact?: string;
  attachments?: File[];
  tags?: string[];
}

// 建议统计数据
export interface FeedbackStats {
  total: number;
  byType: Record<FeedbackType, number>;
  byStatus: Record<FeedbackStatus, number>;
  byPriority: Record<FeedbackPriority, number>;
  recentCount: number; // 最近7天的建议数量
  responseRate: number; // 回复率
  averageResponseTime: number; // 平均回复时间（小时）
}

// 建议筛选参数
export interface FeedbackFilters {
  type?: FeedbackType;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  dateRange?: [string, string];
  searchTerm?: string;
}

// 管理员回复数据
export interface AdminReplyData {
  feedbackId: string;
  reply: string;
  status: FeedbackStatus;
}
