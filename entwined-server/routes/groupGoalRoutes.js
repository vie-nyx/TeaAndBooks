const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const groupGoalController = require("../controllers/groupGoalController");

/*
========================
DEBUG (CONFIRM LOAD)
========================
*/
console.log("🔥 groupGoalRoutes loaded");

/*
========================
GET GOALS
========================
*/
router.get("/group/:conversationId/goals", auth, groupGoalController.getGoals);

/*
========================
CREATE GOAL
========================
*/
router.post("/group/:conversationId/goals", auth, groupGoalController.createGoal);

/*
========================
UPDATE GOAL
========================
*/
router.put("/group/goals/:goalId", auth, (req, res, next) => {
  console.log("🔥 UPDATE GOAL ROUTE HIT");
  next();
}, groupGoalController.updateGoal);

/*
========================
EXPORT
========================
*/
module.exports = router;