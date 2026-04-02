const GroupGoal = require("../models/GroupGoal");

// GET goals
exports.getGoals = async (req, res) => {
  try {
    const goals = await GroupGoal.find({
      conversationId: req.params.conversationId
    }).sort({ createdAt: -1 });

    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE goal
exports.createGoal = async (req, res) => {
    try {
      const activeCount = await GroupGoal.countDocuments({
        conversationId: req.params.conversationId,
        isActive: true
      });
  
      const goal = await GroupGoal.create({
        conversationId: req.params.conversationId,
        createdBy: req.userId,
        bookTitle: req.body.bookTitle,
        weeklyGoal: req.body.weeklyGoal,
        meetingDate: req.body.meetingDate
          ? new Date(req.body.meetingDate)
          : null,
        lastMeetingNotes: req.body.notes,
        isActive: activeCount === 0   // ✅ safer
      });
  
      res.json(goal);
  
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

const Conversation = require("../models/Conversation");

/*
=================================
UPDATE GOAL
=================================
*/
exports.updateGoal = async (req, res) => {
    try {
      const goalId = req.params.goalId;
      console.log("SETTING ACTIVE:", goalId);
  
      const goal = await GroupGoal.findById(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
  
      /*
      🔥 FIX: deactivate ALL first
      */
      if (req.body.isActive) {
        await GroupGoal.updateMany(
            { conversationId: goal.conversationId.toString() },
            { $set: { isActive: false } }
          );
      }
  
      /*
      UPDATE
      */
      const updated = await GroupGoal.findByIdAndUpdate(
        goalId,
        {
          ...req.body,
          meetingDate: req.body.meetingDate
            ? new Date(req.body.meetingDate)
            : goal.meetingDate
        },
        { new: true }
      );
  
      res.json(updated);
  
    } catch (err) {
      console.error("Update goal error:", err);
      res.status(500).json({ message: err.message });
    }
  };