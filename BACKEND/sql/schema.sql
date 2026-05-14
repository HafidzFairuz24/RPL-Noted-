-- ============================================
-- NOTED! - Database Schema
-- MySQL
-- ============================================

CREATE DATABASE IF NOT EXISTS noted_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE noted_db;

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    profile_picture MEDIUMTEXT,
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- WORKSPACES
-- ============================================
CREATE TABLE workspaces (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id    INT          NOT NULL,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- WORKSPACE MEMBERS
-- role: 'owner' | 'member'
-- ============================================
CREATE TABLE workspace_members (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT         NOT NULL,
    user_id      INT         NOT NULL,
    role         ENUM('owner','member') DEFAULT 'member',
    joined_at    DATETIME    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_workspace_user (workspace_id, user_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE
);

-- ============================================
-- LISTS  (inside a workspace)
-- ============================================
CREATE TABLE lists (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT          NOT NULL,
    name         VARCHAR(100) NOT NULL,
    description  TEXT,
    created_by   INT          NOT NULL,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by)   REFERENCES users(id)      ON DELETE CASCADE
);

-- ============================================
-- TASKS  (inside a list)
-- status:   'todo' | 'in_progress' | 'done'
-- priority: 'low'  | 'medium'      | 'high'
-- ============================================
CREATE TABLE tasks (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    list_id      INT          NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    status       ENUM('todo','in_progress','done') DEFAULT 'todo',
    priority     ENUM('low','medium','high')        DEFAULT 'medium',
    due_date     DATE,
    assigned_to  INT,
    created_by   INT          NOT NULL,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id)     REFERENCES lists(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- COMMENTS  (inside a task)
-- ============================================
CREATE TABLE comments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    task_id    INT  NOT NULL,
    user_id    INT  NOT NULL,
    content    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    title      VARCHAR(200) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    BOOLEAN      DEFAULT FALSE,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- BUG REPORTS
-- status: 'open' | 'resolved' | 'closed'
-- ============================================
CREATE TABLE bug_reports (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT         NOT NULL,
    status      ENUM('open', 'resolved', 'closed') DEFAULT 'open',
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
