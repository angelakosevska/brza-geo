import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterForm({ registerData, setRegisterData, handleRegister, onFlip }) {
  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4 p-5 sm:p-8 w-full max-w-xs mx-auto">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 text-[var(--primary)] text-center">
        Register 🎉
      </h2>
      <Input
        type="email"
        placeholder="Email"
        autoComplete="username"
        value={registerData.email}
        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
      />
      <Input
        type="password"
        placeholder="Password"
        autoComplete="new-password"
        value={registerData.password}
        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
      />
      <Input
        type="password"
        placeholder="Repeat Password"
        autoComplete="new-password"
        value={registerData.confirmPassword}
        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
      />
      <Button className="mt-2 w-full" type="submit">
        Register
      </Button>
      <Button
        variant="link"
        className="text-xs sm:text-sm mt-4"
        onClick={onFlip}
        type="button"
      >
        👈 Have an account? <span className="font-semibold">Login</span>
      </Button>
    </form>
  );
}