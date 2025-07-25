import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/server/health", (_, res) => {
  res.send("Server is healthy");
})

app.listen(PORT, () => console.log("Hello from the backend!"));