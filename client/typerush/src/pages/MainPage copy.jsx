import GlassCard from "@/components/global/GlassCard";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/rooms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}), // optional rounds, timer could still be passed
      });

      const data = await res.json();

      if (res.ok) {
        navigate(`/room/${data.room.code}`); // or setRoom(data.room)
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error creating room:", err);
      alert("Server error");
    }
  };
  return (
    <>
      <Header />

      <GlassCard className="w-[90vw]">
        <div className="flex gap-8 mx-auto mt-8 px-2 w-full max-w-4xl">
          <div className="flex flex-col flex-1 justify-center items-center gap-3">
            <Button className="w-full max-w-xs" onClick={handleCreateRoom}>
              Create a room
            </Button>
            <span className="text-gray-500 text-sm">or</span>
            <Button className="w-full max-w-xs">Join a room</Button>
            <Button variant="outline" className="w-full max-w-xs">
              Categories
            </Button>
          </div>
        </div>
      </GlassCard>
    </>
  );
}
