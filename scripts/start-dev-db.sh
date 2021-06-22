#!/bin/bash

set -e

source .env

SERVER="ti-broish";
DATABASE_PASSWORD="${DATABASE_PASSWORD:-ti-broish}";
DATABASE_NAME="${DATABASE_NAME:-ti_broish}";

echo "echo stop & remove old docker [$SERVER] and starting new fresh instance of [$SERVER]"
(docker kill $SERVER || :) && \
  (docker rm $SERVER || :) && \
  docker run --name $SERVER -e POSTGRES_PASSWORD=$DATABASE_PASSWORD \
  -e PGPASSWORD=$DATABASE_PASSWORD \
  -p 5432:5432 \
  -d postgres \
  -c log_statement=all \
  -c log_destination=stderr

# wait for pg to start
echo "sleep wait for pg-server [$SERVER] to start";
SLEEP 10;

# create the db
echo "CREATE DATABASE $DATABASE_NAME ENCODING 'UTF-8';" | docker exec -i $SERVER psql -U postgres
echo "\l" | docker exec -i $SERVER psql -U postgres
