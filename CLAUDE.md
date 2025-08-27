# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based frontend for a mining safety database system. The application provides interfaces for managing mining safety documents, AI chat functionality, user feedback, and data visualization. It's designed to work with a Spring Boot backend API.

### Technology Stack
- **Framework**: React 18+ with TypeScript
- **UI Library**: Ant Design (antd) with custom mining safety theme
- **State Management**: Zustand with persistence
- **Data Fetching**: TanStack React Query (React Query v5)  
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v4 + CSS variables
- **API Client**: Axios with interceptors
- **AI Integration**: SiliconFlow API for mining safety consultations

## Common Development Commands

```bash
# Start development server
npm start

# Run tests  
npm test

# Build for production
npm run build

# Type checking (if available)
npm run type-check

# Linting (if available) 
npm run lint
```

## Architecture Overview

### State Management Strategy
- **Authentication**: Zustand store with persistence (`authStore`)
- **Chat History**: Zustand store for AI conversations (`chatStore`) 
- **Safety Data**: Zustand store for mining documents (`safetyDataStore`)
- **Feedback**: Zustand store for user feedback (`feedbackStore`)
- **Server State**: React Query for API data fetching and caching

### API Integration Patterns
- **Base Service**: `apiService` class with Axios interceptors
- **Authentication**: JWT tokens with automatic injection via interceptors
- **Error Handling**: Global error handling with 401 redirect to login
- **Backend Integration**: REST API calls to Spring Boot backend at `/api` endpoints

### Route Structure
```
/ -> Dashboard (protected)
/login -> Authentication  
/ai-chat -> AI Assistant Interface (protected)
/feedback -> User Feedback System (protected)  
/data-detail/:id -> Safety Document Details (protected)
/add-data -> Data Entry Form (protected, placeholder)
/edit-data/:id -> Data Editing (protected, placeholder)
```

### Component Architecture
- **Layout**: `MainLayout` wrapper for authenticated pages
- **AI Chat**: Modular chat interface with history management
- **Data Management**: CRUD components for safety documents
- **Feedback System**: User feedback collection and display
- **Search/Filters**: Advanced filtering for safety data

### Configuration Management
- **API Config**: Environment-based API endpoints and timeouts
- **AI Config**: SiliconFlow integration with mining safety prompts
- **Theme Config**: Custom Ant Design theme with mining safety colors
- **Feature Flags**: Environment-controlled feature toggles

## Key Integrations

### SiliconFlow AI Assistant
- Specialized mining safety AI with domain expertise
- Supports multiple models: Qwen2.5-7B (primary), DeepSeek variants
- Streaming responses with custom system prompts
- Covers coal mining, metal mining, and general mining safety topics

### Backend API Expectations
- Spring Boot backend with JWT authentication
- RESTful endpoints following `/api/{resource}` pattern
- Standardized response format with `AjaxResult<T>` wrapper
- File upload support with MinIO integration

## Development Guidelines

### API Service Usage
- Use `apiService` instance for all backend calls
- Leverage React Query for data fetching and caching  
- Handle loading states and errors consistently
- Use TypeScript interfaces for API request/response types

### State Management Rules  
- Use Zustand stores for client-side state
- Use React Query for server state and caching
- Persist authentication state with Zustand persistence middleware
- Keep stores focused on single domains (auth, chat, data, etc.)

### Component Patterns
- Follow Ant Design component patterns and theming
- Use TypeScript interfaces for all props and data
- Implement proper loading and error states
- Use React Router for navigation with protected routes

### Environment Configuration
- Copy `.env.example` to `.env.development` for local development
- Configure `REACT_APP_API_BASE_URL` for backend connection
- Set `REACT_APP_SILICONFLOW_API_KEY` for AI functionality
- Use feature flags to enable/disable functionality

## Type System

### Core Types
- `SafetyData`: Mining safety documents with categorization
- `User`: Authentication and profile information  
- `FeedbackItem`: User feedback with status tracking
- `ChatMessage`: AI conversation messages with metadata
- API types for request/response patterns

### API Integration Types
- `ApiResponse<T>`: Standardized response wrapper
- `PaginatedResponse<T>`: Paginated data responses
- Query parameter interfaces for filtering and sorting