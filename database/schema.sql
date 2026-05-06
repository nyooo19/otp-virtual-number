-- OTP Virtual Number Service Database Schema
-- MySQL 5.7+

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `balance` DECIMAL(15, 2) DEFAULT 0.00,
  `referral_code` VARCHAR(20) UNIQUE,
  `referred_by` INT UNSIGNED,
  `is_banned` BOOLEAN DEFAULT FALSE,
  `banned_reason` TEXT,
  `telegram_id` VARCHAR(50),
  `2fa_enabled` BOOLEAN DEFAULT FALSE,
  `2fa_secret` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL,
  KEY `idx_email` (`email`),
  KEY `idx_referral_code` (`referral_code`),
  KEY `idx_is_banned` (`is_banned`),
  FOREIGN KEY (`referred_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_email` (`email`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Sessions Table
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token` VARCHAR(500) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `ip_address` VARCHAR(45),
  `user_agent` VARCHAR(500),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_user_id` (`user_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Sessions Table
CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `admin_id` INT UNSIGNED NOT NULL,
  `token` VARCHAR(500) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `ip_address` VARCHAR(45),
  `user_agent` VARCHAR(500),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Countries Table
CREATE TABLE IF NOT EXISTS `countries` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(5) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `flag` VARCHAR(10),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_code` (`code`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Services Table
CREATE TABLE IF NOT EXISTS `otp_services` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(255),
  `category` ENUM('social', 'email', 'bank', 'marketplace', 'gaming', 'other') DEFAULT 'other',
  `is_active` BOOLEAN DEFAULT TRUE,
  `requires_otp` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_code` (`code`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Operators Table
CREATE TABLE IF NOT EXISTS `operators` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `country_id` INT UNSIGNED NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `provider_code` VARCHAR(50),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_country_code` (`country_id`, `code`),
  KEY `idx_country_id` (`country_id`),
  KEY `idx_is_active` (`is_active`),
  FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Pricing Table
CREATE TABLE IF NOT EXISTS `otp_pricing` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `country_id` INT UNSIGNED NOT NULL,
  `service_id` INT UNSIGNED NOT NULL,
  `operator_id` INT UNSIGNED NOT NULL,
  `cost_price` DECIMAL(10, 2) NOT NULL,
  `sell_price` DECIMAL(10, 2) NOT NULL,
  `markup_percent` DECIMAL(5, 2) DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `min_balance_required` DECIMAL(10, 2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_country_service_operator` (`country_id`, `service_id`, `operator_id`),
  KEY `idx_country_id` (`country_id`),
  KEY `idx_service_id` (`service_id`),
  KEY `idx_operator_id` (`operator_id`),
  KEY `idx_is_active` (`is_active`),
  FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`service_id`) REFERENCES `otp_services`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`operator_id`) REFERENCES `operators`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Orders Table
CREATE TABLE IF NOT EXISTS `otp_orders` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `pricing_id` INT UNSIGNED NOT NULL,
  `provider_order_id` VARCHAR(100) UNIQUE,
  `phone_number` VARCHAR(20),
  `otp_code` VARCHAR(10),
  `status` ENUM('pending', 'received', 'expired', 'cancelled', 'failed') DEFAULT 'pending',
  `price` DECIMAL(10, 2) NOT NULL,
  `provider_name` VARCHAR(50),
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_provider_order_id` (`provider_order_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`pricing_id`) REFERENCES `otp_pricing`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Order Logs Table
CREATE TABLE IF NOT EXISTS `otp_order_logs` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50),
  `message` TEXT,
  `provider_response` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_order_id` (`order_id`),
  KEY `idx_action` (`action`),
  FOREIGN KEY (`order_id`) REFERENCES `otp_orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deposits Table
CREATE TABLE IF NOT EXISTS `deposits` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `transaction_id` VARCHAR(100) UNIQUE,
  `amount` DECIMAL(15, 2) NOT NULL,
  `status` ENUM('pending', 'success', 'failed', 'expired') DEFAULT 'pending',
  `payment_gateway` VARCHAR(50),
  `payment_method` VARCHAR(50),
  `gateway_reference` VARCHAR(100),
  `qris_url` LONGTEXT,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `paid_at` TIMESTAMP NULL,
  `expires_at` TIMESTAMP NULL,
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_gateway_reference` (`gateway_reference`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions Table
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `type` ENUM('deposit', 'order', 'refund', 'manual_add', 'manual_reduce', 'affiliate') DEFAULT 'deposit',
  `amount` DECIMAL(15, 2) NOT NULL,
  `balance_before` DECIMAL(15, 2) NOT NULL,
  `balance_after` DECIMAL(15, 2) NOT NULL,
  `reference_id` INT UNSIGNED,
  `reference_type` VARCHAR(50),
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_reference_id` (`reference_id`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Gateways Table
CREATE TABLE IF NOT EXISTS `payment_gateways` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) UNIQUE NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `config` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_code` (`code`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Providers Table
CREATE TABLE IF NOT EXISTS `otp_providers` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) UNIQUE NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `api_endpoint` VARCHAR(255),
  `is_active` BOOLEAN DEFAULT TRUE,
  `priority` INT DEFAULT 0,
  `config` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_code` (`code`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Website Settings Table
CREATE TABLE IF NOT EXISTS `website_settings` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `setting_key` VARCHAR(100) UNIQUE NOT NULL,
  `setting_value` LONGTEXT,
  `data_type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  `group` VARCHAR(50),
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_setting_key` (`setting_key`),
  KEY `idx_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reseller API Keys Table
CREATE TABLE IF NOT EXISTS `reseller_api_keys` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `api_key` VARCHAR(100) UNIQUE NOT NULL,
  `api_secret` VARCHAR(255) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `rate_limit` INT DEFAULT 100,
  `rate_window_seconds` INT DEFAULT 60,
  `whitelist_ips` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_user_id` (`user_id`),
  KEY `idx_api_key` (`api_key`),
  KEY `idx_is_active` (`is_active`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reseller API Logs Table
CREATE TABLE IF NOT EXISTS `reseller_api_logs` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `api_key_id` INT UNSIGNED NOT NULL,
  `endpoint` VARCHAR(255),
  `method` VARCHAR(10),
  `status_code` INT,
  `response_time` INT,
  `ip_address` VARCHAR(45),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_api_key_id` (`api_key_id`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`api_key_id`) REFERENCES `reseller_api_keys`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Affiliates Table
CREATE TABLE IF NOT EXISTS `affiliates` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `commission_percent_deposit` DECIMAL(5, 2) DEFAULT 0,
  `commission_percent_order` DECIMAL(5, 2) DEFAULT 0,
  `total_commission` DECIMAL(15, 2) DEFAULT 0,
  `total_withdrawn` DECIMAL(15, 2) DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_id` (`user_id`),
  KEY `idx_is_active` (`is_active`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Affiliate Commissions Table
CREATE TABLE IF NOT EXISTS `affiliate_commissions` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `affiliate_id` INT UNSIGNED NOT NULL,
  `referred_user_id` INT UNSIGNED NOT NULL,
  `type` ENUM('deposit', 'order') DEFAULT 'order',
  `reference_id` INT UNSIGNED,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'completed', 'withdrawn') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  KEY `idx_affiliate_id` (`affiliate_id`),
  KEY `idx_referred_user_id` (`referred_user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `admin_id` INT UNSIGNED,
  `user_id` INT UNSIGNED,
  `action` VARCHAR(100),
  `resource_type` VARCHAR(50),
  `resource_id` INT UNSIGNED,
  `old_value` LONGTEXT,
  `new_value` LONGTEXT,
  `ip_address` VARCHAR(45),
  `user_agent` VARCHAR(500),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook Logs Table
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `webhook_type` VARCHAR(50),
  `provider` VARCHAR(50),
  `reference_id` VARCHAR(100),
  `payload` LONGTEXT,
  `response` LONGTEXT,
  `status_code` INT,
  `error_message` TEXT,
  `retry_count` INT DEFAULT 0,
  `next_retry_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL,
  KEY `idx_webhook_type` (`webhook_type`),
  KEY `idx_reference_id` (`reference_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_processed_at` (`processed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Telegram Notifications Table
CREATE TABLE IF NOT EXISTS `telegram_notifications` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT UNSIGNED,
  `telegram_id` VARCHAR(50),
  `notification_type` VARCHAR(50),
  `title` VARCHAR(255),
  `message` LONGTEXT,
  `reference_type` VARCHAR(50),
  `reference_id` INT UNSIGNED,
  `is_sent` BOOLEAN DEFAULT FALSE,
  `sent_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_user_id` (`user_id`),
  KEY `idx_telegram_id` (`telegram_id`),
  KEY `idx_notification_type` (`notification_type`),
  KEY `idx_is_sent` (`is_sent`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pricing History Table
CREATE TABLE IF NOT EXISTS `pricing_history` (
  `id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  `pricing_id` INT UNSIGNED NOT NULL,
  `old_cost_price` DECIMAL(10, 2),
  `new_cost_price` DECIMAL(10, 2),
  `old_sell_price` DECIMAL(10, 2),
  `new_sell_price` DECIMAL(10, 2),
  `old_markup_percent` DECIMAL(5, 2),
  `new_markup_percent` DECIMAL(5, 2),
  `changed_by` INT UNSIGNED,
  `reason` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_pricing_id` (`pricing_id`),
  KEY `idx_changed_by` (`changed_by`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`pricing_id`) REFERENCES `otp_pricing`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`changed_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data

-- Sample Countries
INSERT INTO `countries` (`code`, `name`, `flag`, `is_active`) VALUES
('ID', 'Indonesia', '🇮🇩', TRUE),
('MY', 'Malaysia', '🇲🇾', TRUE),
('TH', 'Thailand', '🇹🇭', TRUE),
('PH', 'Philippines', '🇵🇭', TRUE),
('SG', 'Singapore', '🇸🇬', TRUE);

-- Sample OTP Services
INSERT INTO `otp_services` (`code`, `name`, `description`, `category`, `is_active`) VALUES
('whatsapp', 'WhatsApp', 'Get OTP via WhatsApp', 'social', TRUE),
('telegram', 'Telegram', 'Get OTP via Telegram', 'social', TRUE),
('gmail', 'Gmail', 'Get OTP via Gmail', 'email', TRUE),
('facebook', 'Facebook', 'Get OTP via Facebook', 'social', TRUE),
('twitter', 'Twitter/X', 'Get OTP via Twitter', 'social', TRUE),
('tiktok', 'TikTok', 'Get OTP via TikTok', 'social', TRUE),
('instagram', 'Instagram', 'Get OTP via Instagram', 'social', TRUE),
('shopee', 'Shopee', 'Get OTP via Shopee', 'marketplace', TRUE),
('tokopedia', 'Tokopedia', 'Get OTP via Tokopedia', 'marketplace', TRUE),
('bca', 'BCA Mobile', 'Get OTP via BCA Mobile', 'bank', TRUE);

-- Sample Operators
INSERT INTO `operators` (`country_id`, `code`, `name`, `is_active`) VALUES
(1, 'telkomsel', 'Telkomsel', TRUE),
(1, 'indosat', 'Indosat', TRUE),
(1, 'xl', 'XL Axiata', TRUE),
(1, 'smartfren', 'Smartfren', TRUE),
(2, 'maxis', 'Maxis', TRUE),
(2, 'celcom', 'Celcom', TRUE);

-- Sample Payment Gateways
INSERT INTO `payment_gateways` (`name`, `code`, `is_active`, `config`) VALUES
('Tripay', 'tripay', TRUE, '{"webhook_signature_key":""}'),
('QRISPY', 'qrispy', TRUE, '{}');

-- Sample OTP Providers
INSERT INTO `otp_providers` (`name`, `code`, `api_endpoint`, `is_active`, `priority`) VALUES
('5Sim', '5sim', 'https://api.5sim.net', TRUE, 1),
('Hero SMS', 'hero_sms', 'https://api.herosms.com', TRUE, 2),
('Nokosmurah', 'nokosmurah', 'https://api.nokosmurah.com', TRUE, 3);

-- Sample Website Settings
INSERT INTO `website_settings` (`setting_key`, `setting_value`, `data_type`, `group`, `description`) VALUES
('website_name', 'OTP Virtual Number', 'string', 'general', 'Nama website'),
('website_logo', 'https://via.placeholder.com/200x50?text=OTP', 'string', 'general', 'Logo website'),
('website_description', 'Layanan virtual number untuk mendapatkan OTP', 'string', 'general', 'Deskripsi website'),
('api_key_5sim', '', 'string', 'providers', 'API Key untuk 5Sim'),
('api_key_hero_sms', '', 'string', 'providers', 'API Key untuk Hero SMS'),
('api_key_nokosmurah', '', 'string', 'providers', 'API Key untuk Nokosmurah'),
('api_key_tripay', '', 'string', 'payments', 'API Key untuk Tripay'),
('api_key_qrispy', '', 'string', 'payments', 'API Key untuk QRISPY'),
('affiliate_commission_deposit', '5.00', 'number', 'affiliate', 'Komisi affiliate untuk deposit (%)'),
('affiliate_commission_order', '10.00', 'number', 'affiliate', 'Komisi affiliate untuk order (%)'),
('otp_expiry_minutes', '15', 'number', 'otp', 'Waktu expired order OTP (menit)'),
('min_deposit_amount', '10000', 'number', 'deposit', 'Minimal jumlah deposit'),
('max_active_orders', '5', 'number', 'limits', 'Maksimal order aktif per user'),
('otp_check_interval_seconds', '15', 'number', 'jobs', 'Interval cek OTP (detik)'),
('dark_mode_enabled', 'true', 'boolean', 'ui', 'Enable dark mode');