import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Zod schema за валидација на login

const loginSchema = z.object({
  login: z.string().min(1, "Полето е задолжително"),
  password: z.string().min(8, "Лозинката мора да има најмалку 8 карактери"),
});

export function LoginForm({ handleLogin, onFlip, onForgotPassword }) {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
    handleLogin({ preventDefault: () => {} }, data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 p-4 sm:p-8 w-full"
      >
        <p className="mb-2 font-extrabold text-[var(--primary)] text-xl sm:text-2xl md:text-3xl text-center">
          Логирај се!
        </p>

        {/* Login Identifier (username или email) */}
        <FormField
          control={form.control}
          name="login"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Корисничко име или е-пошта</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Внеси корисничко име или е-пошта"
                  autoComplete="username"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Лозинка</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Лозинка"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Forgot password */}
        <div className="text-right">
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-[var(--primary)] text-xs sm:text-sm"
            onClick={onForgotPassword}
          >
            Заборавена лозинка?
          </Button>
        </div>

        {/* Submit */}
        <Button className="mt-2 w-full" type="submit">
          Логирај се
        </Button>

        {/* Flip to register */}

        <div className="mt-4 text-[var(--text)] text-xs sm:text-sm text-center">
          <span className="mr-1">Немаш профил?</span>
          <Button
            variant="link"
            className="p-0 h-auto font-semibold text-[var(--primary)]"
            onClick={onFlip}
            type="button"
          >
            Регистрирај се
          </Button>
        </div>
      </form>
    </Form>
  );
}
