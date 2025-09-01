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

// 用户建议接口 - 与API响应完全匹配
export interface UserFeedback {
  id: number;
  userId: number;
  type: FeedbackType;
  title: string;
  content: string;          // API返回的是content，不是description
  contactInfo: string;
  status: FeedbackStatus;
  reply: string;            // API返回的是reply，不是adminReply
  createdAt: string;
  
  // 兼容性字段（用于组件显示，需要从其他字段计算或默认值）
  description?: string;     // 映射到content
  userName?: string;        // 从contactInfo解析或设为默认值
  userEmail?: string;       // 从contactInfo解析或设为默认值
  adminReply?: string;      // 映射到reply
  upvotes?: number;         // 默认值
  downvotes?: number;       // 默认值
  priority?: FeedbackPriority; // 默认值
}

// 建议提交表单数据 - 匹配后端SubmitFeedbackRequest
export interface FeedbackFormData {
  type: FeedbackType;
  title: string;
  content: string;          // 改为content匹配后端
  contactInfo?: string;     // 合并联系信息到单个字段
  
  // 向后兼容的字段
  description?: string;     // 兼容字段，会映射到content
  priority?: FeedbackPriority;
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

// 管理员处理反馈请求 - 匹配后端HandleFeedbackRequest
export interface HandleFeedbackRequest {
  feedbackId: number;
  status: FeedbackStatus;
  reply: string;
}

// 反馈详情响应 - 匹配后端GetFeedbackDetailResponse  
export interface FeedbackDetailResponse {
  userId: number;
  type: FeedbackType;
  title: string;
  content: string;
  contactInfo: string;
  status: FeedbackStatus;
  reply: string;
  createdAt: string;
}
