import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({ loginData, setLoginData, handleLogin, onFlip }) {
  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4 p-5 sm:p-8 w-full max-w-xs mx-auto">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 text-[var(--primary)] text-center">
        Login 🚀
      </h2>
      <Input
        type="email"
        placeholder="Email"
        autoComplete="username"
        value={loginData.email}
        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
      />
      <Input
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={loginData.password}
        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
      />
      <Button className="mt-2 w-full" type="submit">
        Log In
      </Button>
      <Button
        variant="link"
        className="text-xs sm:text-sm mt-4"
        onClick={onFlip}
        type="button"
      >
        👉 No account? <span className="font-semibold">Register</span>
      </Button>
    </form>
  );
}