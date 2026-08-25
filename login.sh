#!/bin/bash
pm2 stop wa-bot-v10
rm -rf auth-v7/*
node pair.js \
