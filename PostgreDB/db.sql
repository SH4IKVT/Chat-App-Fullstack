CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_email TEXT NOT NULL ,
    receiver_email TEXT NOT NULL ,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO messages (sender_email, receiver_email, message)
VALUES ('user1@gmail.com', 'user2@gmail.com', 'Hello from PostgreSQL');
SELECT *
FROM messages
WHERE receiver_email = 'ALL';
