import express from "express"
import dotenv from "dotenv"
import connectDB from "./libs/db.js";
import userRoutes from "./routers/user.router.js"
import challengeRoutes from "./routers/challenge.router.js";
import challengeEntry from "./routers/challengeEntry.router.js"
import walletRoutes from './routers/wallet.router.js';
import paymentRoutes from "./routers/payment.router.js";
import juryRoutes from "./routers/jury.router.js";
import voteRoutes from "./routers/vote.router.js";
import { webhook } from "./controllers/payment.controller.js";
import cors from "cors"

dotenv.config();
connectDB()
const app = express()

const port = process.env.PORT || 5000


app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  webhook
);

app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.get('/',(req,res)=>{
    res.send("This is create challenge backend")
})


app.use("/api/user", userRoutes);
app.use("/api/challenge", challengeRoutes);
app.use("/api/entry", challengeEntry)
app.use('/api/wallet', walletRoutes);
app.use("/api/payment", paymentRoutes)
app.use("/api/jury", juryRoutes);
app.use("/api/votes", voteRoutes);

app.listen(port , ()=>{
    console.log(`Server is running on port ${port}`)
})