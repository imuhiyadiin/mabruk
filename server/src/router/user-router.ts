import { Router } from "express";
import { allUsers, chanegRole, googleUserLogin, registerUser, updateUser, userLogin, whoami } from "../controller/user-controller";
import { verifyToken } from "../midlewhere/auth";
const router = Router();

// create post method
// get list get
// update put or patch
// delete delete
// options loading

router.post("/", registerUser);
router.post("/login", userLogin);
router.post("/google-login", googleUserLogin);
router.get('/whoami',verifyToken,whoami)
router.put('/:id',verifyToken,updateUser)
router.get('/list',verifyToken,allUsers)
router.patch('/role',verifyToken,chanegRole)

export default router;
