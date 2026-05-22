import { Navigate, useParams } from "react-router-dom";

export default function ProfilePage() {
  const { id } = useParams();

  return <Navigate to={`/dashboard/profile/${id}`} replace />;
}
