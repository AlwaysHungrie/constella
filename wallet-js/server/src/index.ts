import express from "express";
import cors from "cors";
import config from "./config";
import router from "./routes/apiRouter";

const { PORT, FRONTEND_URL } = config;

const app = express();

app.use(cors({
  origin: FRONTEND_URL,
}));
app.use(express.json());

app.use("/api/v1", router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});