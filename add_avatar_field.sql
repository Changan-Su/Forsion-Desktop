-- 添加 avatar 字段到 users 表
-- 如果字段已存在，这个脚本会失败，但这是预期的

-- 检查并添加 avatar 字段（如果不存在）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) NULL COMMENT '用户头像URL';

-- 或者，如果 MySQL 版本不支持 IF NOT EXISTS，使用以下方式：
-- 先检查字段是否存在，如果不存在则添加
-- SELECT COUNT(*) INTO @col_exists 
-- FROM information_schema.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME = 'users' 
-- AND COLUMN_NAME = 'avatar';

-- IF @col_exists = 0 THEN
--   ALTER TABLE users ADD COLUMN avatar VARCHAR(500) NULL COMMENT '用户头像URL';
-- END IF;

