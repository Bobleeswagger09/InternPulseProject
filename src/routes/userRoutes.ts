import { Router } from "express";
import {
  createUser,
  getUserByName,
  getUserById,
  updateUserById,
  updateUserByName,
  deleteUserById,
  deleteUserByName,
} from "../controllers/userController";

const router = Router();

router.post("/users", createUser);
router.get("/users", getUserByName);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUserById);
router.put("/users", updateUserByName);
router.delete("/users", deleteUserByName);
router.delete("/users/:id", deleteUserById);

export default router;
