-- Create Call Logs Table
CREATE TABLE IF NOT EXISTS call_logs (
    id SERIAL PRIMARY KEY,
    caller_number VARCHAR(50),
    agent_extension VARCHAR(50),
    duration INTEGER DEFAULT 0, -- Duration in seconds
    status VARCHAR(20) CHECK (status IN ('ANSWERED', 'MISSED', 'BUSY', 'IVR_ONLY')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recording_path TEXT
);

-- Create Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    freshdesk_ticket_id VARCHAR(50) NOT NULL,
    call_id INTEGER REFERENCES call_logs(id),
    issue_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
