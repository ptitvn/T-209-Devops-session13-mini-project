ALTER TABLE posts
    ADD COLUMN image_url VARCHAR(500) NULL AFTER content,
    ADD COLUMN allow_registration BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
    ADD COLUMN max_participants INT NULL AFTER allow_registration;

CREATE TABLE registrations (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    contact_info VARCHAR(150) NOT NULL,
    message VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_registration_post_user UNIQUE (post_id, user_id),
    CONSTRAINT fk_registrations_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_registrations_post ON registrations(post_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(status);
