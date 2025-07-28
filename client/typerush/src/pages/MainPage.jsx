import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

export default function MainPage() {
  return (
    <>
      <Header />

      {/* Main actions */}
      <div className="flex w-full max-w-4xl mx-auto mt-8 gap-8 px-2">
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Button className="w-full max-w-xs">Create a room</Button>
          <span className="text-sm text-gray-500">or</span>
          <Button className="w-full max-w-xs">Join a room</Button>
          <Button variant="outline" className="w-full max-w-xs">
            Categories
          </Button>
        </div>
      </div>
    </>
  );
}
