import { useState } from "react";
import GroupGoals from "./GroupGoals";

export default function GroupTabs({ conversation, messagesUI }) {
  const [tab, setTab] = useState("chat");

  const isBookClub = conversation.groupType === "bookclub";

  return (
    <>
      {isBookClub && (
        <div className="tabs">
          <button onClick={() => setTab("chat")}>Chat</button>
          <button onClick={() => setTab("goals")}>Goals</button>
        </div>
      )}

      {tab === "chat" && messagesUI}

      {tab === "goals" && <GroupGoals conversationId={conversation._id} />}
    </>
  );
}