// mongo-init.js
db.createUser({
    user: "appwrite_user",
    pwd: "appwrite_password",
    roles: [
        {
            role: "readWrite",
            db: "appwrite"
        }
    ]
});
