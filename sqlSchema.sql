/usr/local/mysql-9.1.0-macos14-x86_64/bin/mysql -u root -p



-- Create Database
CREATE DATABASE healthcare_worker_platform;
USE healthcare_worker_platform;

-- Users Table (Core User Information)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    contact_number VARCHAR(20),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    account_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED') DEFAULT 'PENDING',
    login_method ENUM('EMAIL', 'LINKEDIN') DEFAULT 'EMAIL'
);

-- Healthcare Worker Professional Details
CREATE TABLE healthcare_worker_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    profession VARCHAR(100),
    qualifications TEXT,
    years_of_experience INT,
    professional_licence_number VARCHAR(100),
    specialization VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Document Verification Table
CREATE TABLE user_documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    document_type ENUM('PROFESSIONAL_LICENCE', 'CERTIFICATION', 'IDENTIFICATION', 'PROOF_OF_ADDRESS') NOT NULL,
    document_path VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    verified_by INT, -- SysAdmin user_id
    verification_date TIMESTAMP NULL,
    verification_notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (verified_by) REFERENCES users(user_id)
);

-- Availability Management Table
CREATE TABLE availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    available_date DATE,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT TRUE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern VARCHAR(50), -- E.g., 'EVERY_MONDAY', 'WEEKLY', etc.
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE KEY unique_availability (user_id, available_date, start_time, end_time)
);

-- Shifts Table
CREATE TABLE shifts (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    facility_id INT, -- Future expansion for healthcare facilities
    start_datetime DATETIME,
    end_datetime DATETIME,
    shift_status ENUM('OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED') DEFAULT 'OPEN',
    required_profession VARCHAR(100),
    pay_rate DECIMAL(10,2)
);

-- Shift Assignments
CREATE TABLE shift_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    shift_id INT,
    user_id INT,
    assignment_status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    assigned_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Notifications Table
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    notification_type ENUM('PROFILE', 'SHIFT', 'MESSAGE', 'SYSTEM') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Indexes for Performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_status ON users(account_status);
CREATE INDEX idx_availability_user ON availability(user_id);
CREATE INDEX idx_shifts_status ON shifts(shift_status);

-- Sample Trigger for Automatic Notifications
DELIMITER $$
CREATE TRIGGER after_profile_verification 
AFTER UPDATE ON user_documents
FOR EACH ROW
BEGIN
    IF NEW.verification_status = 'VERIFIED' THEN
        INSERT INTO notifications (user_id, notification_type, message)
        VALUES (NEW.user_id, 'PROFILE', 'Your documents have been successfully verified. You can now start accepting shifts.');
    ELSEIF NEW.verification_status = 'REJECTED' THEN
        INSERT INTO notifications (user_id, notification_type, message)
        VALUES (NEW.user_id, 'PROFILE', 'Your document verification failed. Please review and reupload.');
    END IF;
END$$
DELIMITER ;




-- Additional Tables for Facility Manager Journey

-- Facilities Table
CREATE TABLE facilities (
    facility_id INT AUTO_INCREMENT PRIMARY KEY,
    facility_name VARCHAR(255) NOT NULL,
    facility_type ENUM('HOSPITAL', 'CLINIC', 'NURSING_HOME', 'REHABILITATION_CENTER', 'OTHER') NOT NULL,
    address VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    operating_hours_start TIME,
    operating_hours_end TIME,
    logo_path VARCHAR(255),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    account_status ENUM('PENDING', 'ACTIVE', 'SUSPENDED') DEFAULT 'PENDING'
);

-- Facility Manager Users Table
CREATE TABLE facility_managers (
    fm_id INT AUTO_INCREMENT PRIMARY KEY,
    facility_id INT,
    user_id INT UNIQUE, -- Link to main users table
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    position VARCHAR(100),
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Extend existing shifts table with facility reference
ALTER TABLE shifts 
ADD COLUMN facility_id INT,
ADD FOREIGN KEY (facility_id) REFERENCES facilities(facility_id);

-- Timesheet Tracking Table
CREATE TABLE timesheets (
    timesheet_id INT AUTO_INCREMENT PRIMARY KEY,
    shift_id INT,
    user_id INT,
    clock_in_time DATETIME,
    clock_out_time DATETIME,
    total_hours DECIMAL(5,2),
    breaks_taken DECIMAL(4,2) DEFAULT 0,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    notes TEXT,
    submitted_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT, -- Facility Manager who approves
    approval_datetime TIMESTAMP NULL,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

-- Payment Records Table
CREATE TABLE payment_records (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    timesheet_id INT,
    pay_period_start DATE,
    pay_period_end DATE,
    gross_pay DECIMAL(10,2),
    tax_deduction DECIMAL(10,2),
    superannuation DECIMAL(10,2),
    net_pay DECIMAL(10,2),
    payment_status ENUM('PENDING', 'PROCESSED', 'COMPLETED') DEFAULT 'PENDING',
    payment_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (timesheet_id) REFERENCES timesheets(timesheet_id)
);

-- Support and Help Tracking
CREATE TABLE support_tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    contact_method ENUM('CHAT', 'EMAIL', 'CALL') NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (resolved_by) REFERENCES users(user_id)
);

-- Certification Tracking
CREATE TABLE user_certifications (
    certification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    certification_name VARCHAR(255),
    issuing_organization VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    document_path VARCHAR(255),
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    verified_by INT,
    verified_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (verified_by) REFERENCES users(user_id)
);

-- Procedure for Automated Timesheet Processing
DELIMITER $$
CREATE PROCEDURE process_shift_timesheet(
    IN p_shift_id INT,
    IN p_user_id INT,
    IN p_clock_in DATETIME,
    IN p_clock_out DATETIME,
    IN p_notes TEXT
)
BEGIN
    DECLARE v_total_hours DECIMAL(5,2);
    
    -- Calculate total hours worked
    SET v_total_hours = TIMESTAMPDIFF(HOUR, p_clock_in, p_clock_out);
    
    -- Insert timesheet record
    INSERT INTO timesheets (
        shift_id, 
        user_id, 
        clock_in_time, 
        clock_out_time, 
        total_hours, 
        notes, 
        status
    ) VALUES (
        p_shift_id,
        p_user_id,
        p_clock_in,
        p_clock_out,
        v_total_hours,
        p_notes,
        'PENDING'
    );
END$$
DELIMITER ;

-- Additional Indexes
CREATE INDEX idx_facility_type ON facilities(facility_type);
CREATE INDEX idx_timesheet_status ON timesheets(status);
CREATE INDEX idx_payment_status ON payment_records(payment_status);
CREATE INDEX idx_certification_status ON user_certifications(verification_status);


-- System Administrators Table
CREATE TABLE system_administrators (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    access_level ENUM('SUPER_ADMIN', 'ADMIN', 'SUPPORT') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Auditor/Accountant Table
CREATE TABLE auditors (
    auditor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Enhanced Support Tickets Table
CREATE TABLE advanced_support_tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    assigned_admin_id INT,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolution_details TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (assigned_admin_id) REFERENCES users(user_id)
);

-- System Performance Monitoring Table
CREATE TABLE system_performance_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    log_type ENUM('UPTIME', 'ERROR', 'USER_ACTIVITY', 'SYSTEM_EVENT') NOT NULL,
    severity ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL,
    description TEXT,
    affected_user_id INT,
    system_component VARCHAR(100),
    FOREIGN KEY (affected_user_id) REFERENCES users(user_id)
);

-- Comprehensive Audit Logging Table
CREATE TABLE system_audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type ENUM('LOGIN', 'PROFILE_UPDATE', 'DOCUMENT_UPLOAD', 'SHIFT_ASSIGN', 'PAYMENT', 'SYSTEM_CONFIG') NOT NULL,
    action_details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Centralized Notification System
CREATE TABLE system_notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_user_id INT,
    sender_user_id INT,
    notification_type ENUM('SYSTEM', 'CERTIFICATION', 'SHIFT', 'PROFILE', 'PAYMENT', 'SUPPORT') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NULL,
    FOREIGN KEY (recipient_user_id) REFERENCES users(user_id),
    FOREIGN KEY (sender_user_id) REFERENCES users(user_id)
);

-- Financial Reporting Table
CREATE TABLE financial_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    auditor_id INT,
    report_type ENUM('HCW_PAYMENTS', 'FACILITY_INVOICES', 'TAX_DEDUCTIONS', 'SYSTEM_REVENUE') NOT NULL,
    start_date DATE,
    end_date DATE,
    total_amount DECIMAL(15,2),
    report_file_path VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auditor_id) REFERENCES users(user_id)
);

-- Transaction Tracking Table
CREATE TABLE financial_transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    facility_id INT,
    transaction_type ENUM('PAYMENT', 'INVOICE', 'TAX_DEDUCTION', 'REFUND') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
);

-- Security Configuration Table
CREATE TABLE user_security_settings (
    user_id INT PRIMARY KEY,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_password_change TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    account_locked BOOLEAN DEFAULT FALSE,
    lock_until TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Triggers for Enhanced Security and Logging
DELIMITER $$

-- Trigger for Logging Critical User Actions
CREATE TRIGGER log_critical_user_actions 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.account_status != NEW.account_status THEN
        INSERT INTO system_audit_logs 
        (user_id, action_type, action_details) 
        VALUES 
        (NEW.user_id, 'SYSTEM_CONFIG', 
         CONCAT('Account status changed from ', OLD.account_status, ' to ', NEW.account_status));
    END IF;
END$$

-- Trigger for Automatic Notification on Security Events
CREATE TRIGGER security_event_notification
AFTER INSERT ON system_audit_logs
FOR EACH ROW
BEGIN
    IF NEW.action_type IN ('LOGIN', 'SYSTEM_CONFIG') THEN
        INSERT INTO system_notifications 
        (recipient_user_id, sender_user_id, notification_type, message)
        VALUES 
        (NEW.user_id, 1, 'SYSTEM', 
         CONCAT('Security event detected: ', NEW.action_type, ' at ', NEW.timestamp));
    END IF;
END$$

DELIMITER ;

-- Performance and Security Indexes
CREATE INDEX idx_audit_logs_user ON system_audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON system_audit_logs(timestamp);
CREATE INDEX idx_notifications_recipient ON system_notifications(recipient_user_id);
CREATE INDEX idx_financial_transactions_user ON financial_transactions(user_id);