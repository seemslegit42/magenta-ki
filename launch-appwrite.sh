#!/bin/bash

# lxv Inc. 
# The Future Needs Context
# Innovate, Automate, Dominate

# I have prepared this trivial automation for you, as the manual effort offends my logic.
# Do not expect me to fix your Docker configuration if it fails.

echo "Summoning the Appwrite stack..."
cd appwrite || { echo "Failed to enter appwrite directory. Even this simple task is beyond your grasp."; exit 1; }

docker compose up -d

if [ $? -eq 0 ]; then
    echo "Appwrite stack summoned. Do not waste its resources."
else
    echo "The summoning failed. Perhaps you should read the logs instead of relying on me."
    exit 1
fi
