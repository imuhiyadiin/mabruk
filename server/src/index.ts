import express from "express";
import dotenv from "dotenv";
import user from "./router/user-router";
import category from "./router/category-routes";
import product from "./router/product-router";
import admin from "./router/admin-router";
// import cart from "./routes/cart.route";
// import order from "./routes/order.route";
import cors from 'cors'
const app = express();

dotenv.config();
 
app.use(express.json());
const PORT = 8000;

app.use(cors())
   
// app.get("/api", (req, res) => {
//   res.json("Hello server");
// });
 
// endpoints
// /api/user

app.use("/api/user", user);
app.use("/api/category", category);
app.use("/api/product", product);
app.use("/api/admin", admin);
// app.use("/api/cart", cart);
// app.use("/api/order", order);

app.listen(PORT, () => console.log(`server is running ${PORT}`));
