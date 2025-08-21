import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({
  loginData,
  setLoginData,
  handleLogin,
  onFlip,
  onForgotPassword,
}) {
  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col gap-4 p-4 sm:p-8 w-full max-w-xs mx-auto"
    >
      <p className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 text-[var(--primary)] text-center">
        Логирај се!
      </p>

      <Input
        type="text"
        placeholder="Корисничко име или е-пошта"
        autoComplete="username"
        value={loginData.email}
        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
      />

      <Input
        type="password"
        placeholder="Лозинка"
        autoComplete="current-password"
        value={loginData.password}
        onChange={(e) =>
          setLoginData({ ...loginData, password: e.target.value })
        }
      />

      <div className="text-right">
        <Button
          type="button"
          variant="link"
          className="text-xs sm:text-sm p-0 h-auto text-[var(--primary)]"
          onClick={onForgotPassword}
        >
          Заборавена лозинка?
        </Button>
      </div>

      <Button className="mt-2 w-full" type="submit">
        Логирај се
      </Button>

      <Button
        variant="link"
        className="text-xs sm:text-sm mt-4"
        onClick={onFlip}
        type="button"
      >
        👉 Немаш профил?<span className="font-semibold">Регистрирај се</span>
      </Button>
    </form>
  );
}
