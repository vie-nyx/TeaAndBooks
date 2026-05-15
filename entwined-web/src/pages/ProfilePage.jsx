import { useParams } from "react-router-dom";
import ProfileDashboard from "../components/profile/ProfileDashboard";
import "../styles/Dashboard.css";

export default function ProfilePage() {
  const { id } = useParams();

  return (
    <div className="feed-layout">
      <ProfileDashboard userId={id} />
    </div>
  );
}
