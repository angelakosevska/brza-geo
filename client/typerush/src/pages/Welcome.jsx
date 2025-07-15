import LetterBackground from "../components/LetterBackground";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function Welcome({ onStart }) {
  return (
    <LetterBackground>
      <div className="w-full min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-[90vw] max-h-[90vh] bg-white/10 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Left side: How to Play placeholder */}

          <div className="md:w-1/2 p-6 flex flex-col justify-center items-center text-center text-gray-800 dark:text-gray-200">
            <CardHeader className="w-full flex flex-col items-center">
              <CardTitle className="w-full text-4xl font-extrabold text-gray-900 dark:text-white text-center">
                Welcome to{" "}
                <img
                  src="/TR.svg"
                  alt="Type Rush Logo"
                  className="h-12 md:h-16 mb-6"
                />
              </CardTitle>
            </CardHeader>

            <CardContent className="max-w-xl text-base md:text-lg mb-8">
              <p>
                Race against the clock and your friends. <br />
                Test your typing skills in this fast-paced, thrilling game!
              </p>
            </CardContent>
            {/* Right side: Welcome text and buttons */}
            <CardFooter className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
              <Button size="lg" className="w-full" onClick={onStart}>
                Start Playing as Guest
              </Button>

              <Button variant="outline" size="lg" className="w-full">
                Login or Register
              </Button>
            </CardFooter>
          </div>
          <div className="md:w-1/2 p-6 bg-white/20 flex items-center justify-center text-gray-900 dark:text-white text-center">
            <div>
              <h2 className="text-2xl font-semibold mb-4">How to Play</h2>
              <p className="text-base md:text-lg max-w-md mx-auto">
                {/* Replace this with your actual content */}
                This section will explain how the game is played with simple
                steps and visuals.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </LetterBackground>
  );
}
