#!/bin/bash
rm bin/*
cp src/* bin/.

. ./alexa_config.bash

sed -i "" "s/%%APP_ID%%/$APP_ID/g" bin/index.js
sed -i "" "s/%%API_KEY%%/$API_KEY/g" bin/index.js

cd bin
zip -r demo.zip *