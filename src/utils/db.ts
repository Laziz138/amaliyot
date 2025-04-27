const { Client } = require("pg");

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "yourpassword",
  port: 5432,
});

client
  .connect()
  .then(() => {
    console.log("PostgreSQL ulanishi muvaffaqiyatli!");
  })
  .catch((err) => {
    console.error("PostgreSQL ulanishi xatolik bilan yakunlandi:", err);
  });

module.exports = client;
