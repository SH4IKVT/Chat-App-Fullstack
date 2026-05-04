CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_email TEXT NOT NULL ,
    receiver_email TEXT NOT NULL ,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- broadcast me
SELECT *
FROM messages
WHERE receiver_email = 'ALL';
select * from messages;
