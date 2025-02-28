# Database Sharding (Node.js, Postgres, Docker)
### 1. Create a docker image for postgres shard
    Follow Dockerfile

### 2. Run 3 postgres shards from same image, which will create same table URL_TABLE in all 3 shards through init.sql
    $ docker run -d --name shard1 -p 5001:5432 -e POSTGRES_PASSWORD="postgres" pgshard
    $ docker run -d --name shard2 -p 5002:5432 -e POSTGRES_PASSWORD="postgres" pgshard
    $ docker run -d --name shard3 -p 5003:5432 -e POSTGRES_PASSWORD="postgres" pgshard

### 3. init.sql
    CREATE TABLE URL_TABLE
    (
        ID serial not null primary key,
        LONG_URL text,
        SHORT_CODE character(5)
    )

### 4. Run the application, and do GET and POST which gets directed to one of the three shards via app (index.js)
