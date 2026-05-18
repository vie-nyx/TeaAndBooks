import { useContext } from "react";
import { SocketContext } from "../contexts/SocketContextValue";

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
