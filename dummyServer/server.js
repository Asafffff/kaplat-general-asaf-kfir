const express = require("express");
const app = express();
const bodyParser = require("body-parser");

app.use(
    bodyParser.json({
      type() {
        return true;
      },
    })
);

app.get("/test_get_method", (req, res) => {
  console.log("GET:");
  console.log("   Query params: " + JSON.stringify(req.query));
  res.status(200).send("response from get");
});

app.post("/test_post_method", (req, res) => {
  console.log("POST:");
  console.log("   Body: " + JSON.stringify(req.body));
  res.status(201).send({ message: "response from post" });
});

app.put("/test_put_method", (req, res) => {
  console.log("PUT:");
  console.log("   Query params: " + JSON.stringify(req.query));
  console.log("   Body: " + JSON.stringify(req.body));
  res.status(201).send({ message: "response from put" });
});

app.delete("/test_delete_method", (req, res) => {
  console.log("DELETE:");
  console.log("   Query params: " + JSON.stringify(req.query));
  res.status(201).send({ message: "response from delete" });
});

const server = app.listen(8989, () => {
  console.log("Server listening on port 8989...\n");
});
