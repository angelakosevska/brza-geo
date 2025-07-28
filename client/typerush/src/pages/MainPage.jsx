import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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

      {/* Main actions */}
      <div className="flex w-full max-w-4xl mx-auto mt-8 gap-8 px-2">
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Button
            className="w-full max-w-xs"
           onClick={handleCreateRoom}
          >
            Create a room
          </Button>
          <span className="text-sm text-gray-500">or</span>
          <Button className="w-full max-w-xs">Join a room</Button>
          <Button variant="outline" className="w-full max-w-xs">
            Categories
          </Button>
        </div>
      </div>

      {/* Modal for creating a room */}
    </>
  );
}
