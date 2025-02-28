const express = require("express");
const {Client} = require("pg");
const crypto = require("crypto");
const hashring = require("hashring");
const ring = new hashring();

const app = express();

ring.add("5001");
ring.add("5002");
ring.add("5003");

const clients = {
    "5001" : new Client({
        "host" : "localhost",
        "port" : "5001",
        "user" : "postgres",
        "password" : "postgres",
        "database" : "postgres",
    }),
    "5002" : new Client({
        "host" : "localhost",
        "port" : "5002",
        "user" : "postgres",
        "password" : "postgres",
        "database" : "postgres",
    }),
    "5003" : new Client({
        "host" : "localhost",
        "port" : "5003",
        "user" : "postgres",
        "password" : "postgres",
        "database" : "postgres",
    })
}

connect();

async function connect() {
    await clients["5001"].connect();
    await clients["5002"].connect();
    await clients["5003"].connect();
}

app.get("/:shortUrl", async (req, res) => {
    // http://localhost:8081/MgN7U
    const shortCode = req.params.shortUrl;
    const server = ring.get(shortCode);

    // Direct the query to the selected shard
    const result = await clients[server].query("SELECT * FROM URL_TABLE WHERE SHORT_CODE = $1", [shortCode]);

    if (result.rowCount > 0)
        res.send({
            "shortCode": shortCode,
            "longUrl": result.rows[0],
            "shard": server 
        });
    else
        res.send(404);
}) 


// POST - PARAMS <longurl, verylongurl> 
app.post("/", async (req, res) => {
    const longUrl = req.query.longurl;

    const hash = crypto.createHash("sha256").update(longUrl).digest("base64");
    const shortCode = hash.substr(0, 5)
    const server = ring.get(shortCode);

    // Direct the query to the selected shard
    await clients[server].query("INSERT INTO URL_TABLE (LONG_URL, SHORT_CODE) VALUES($1, $2)", [longUrl, shortCode]);

    res.send({
        "shortCode": shortCode,
        "longUrl": longUrl,
        "shard": server 
    });
})

app.listen(8081, console.log("Server running on PORT 8081"));

/*
 POST 20 entries
> PARAMS <longurl, verylongurl> => <longurl, https://en.wikipedia.org/wiki/Shard_(database_architecture)1> 

Shard-1
id  long_url                                                        short_url
1	"https://en.wikipedia.org/wiki/Shard_(database_architecture)1"	"Na1+r"
2	"https://en.wikipedia.org/wiki/Shard_(database_architecture)3"	"MgN7U"
3	"https://en.wikipedia.org/wiki/Shard_(database_architecture)5"	"hUkgZ"
4	"https://en.wikipedia.org/wiki/Shard_(database_architecture)10"	"gm3l5"
5	"https://en.wikipedia.org/wiki/Shard_(database_architecture)11"	"txFIv"
6	"https://en.wikipedia.org/wiki/Shard_(database_architecture)13"	"51Xq6"
7	"https://en.wikipedia.org/wiki/Shard_(database_architecture)14"	"Ud/AZ"
8	"https://en.wikipedia.org/wiki/Shard_(database_architecture)18"	"9/FK2"


Shard-2
1	"https://en.wikipedia.org/wiki/Shard_(database_architecture)2"	"i71kL"
2	"https://en.wikipedia.org/wiki/Shard_(database_architecture)4"	"+C9qj"
3	"https://en.wikipedia.org/wiki/Shard_(database_architecture)8"	"oLpyT"
4	"https://en.wikipedia.org/wiki/Shard_(database_architecture)12"	"aRK0A"
5	"https://en.wikipedia.org/wiki/Shard_(database_architecture)15"	"/gcN5"
6	"https://en.wikipedia.org/wiki/Shard_(database_architecture)16"	"WbGYQ"
7	"https://en.wikipedia.org/wiki/Shard_(database_architecture)17"	"iwlBS"
8	"https://en.wikipedia.org/wiki/Shard_(database_architecture)19"	"FBk8/"

Shard-3
1	"https://en.wikipedia.org/wiki/Shard_(database_architecture)6"	"CJRmO"
2	"https://en.wikipedia.org/wiki/Shard_(database_architecture)7"	"jw5DE"
3	"https://en.wikipedia.org/wiki/Shard_(database_architecture)9"	"Vuw5r"
4	"https://en.wikipedia.org/wiki/Shard_(database_architecture)20"	"p2izY"

*/
