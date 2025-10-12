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

// Zod schema за валидација на регистрација
const registerSchema = z
  .object({
    username: z.string().min(3, "Корисничкото име мора да има барем 3 карактери"),
    email: z.string().email("Внесете валиден email"),
    password: z
      .string()
      .min(
        8,
        "Лозинката мора да има најмалку 8 карактери од кои најмалку една голема, една мала буква, еден број и еден карактер (!,@.)"
      ),
    confirmPassword: z.string().min(8, "Потврдата на лозинка е задолжителна"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Лозинките мора да се совпаѓаат",
  });

export function RegisterForm({ handleRegister, onFlip }) {
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data) => {
    handleRegister({ preventDefault: () => {} }, data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center gap-4 p-4 sm:p-8 w-full"
      >
        <h2 className="mb-2 font-extrabold text-[var(--primary)] text-xl sm:text-2xl md:text-3xl text-center">
          Регистрирај се!
        </h2>

        <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-sm">
          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Корисничко име</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Корисничко име"
                    autoComplete="username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Е-пошта</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Е-пошта"
                    autoComplete="email"
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
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Повтори лозинка</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Повтори лозинка"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <Button className="mt-2 w-full" type="submit">
            Регистрирај се
          </Button>
        </div>

        {/* Flip to login */}
        <div className="mt-4 text-xs sm:text-sm text-center">
          <span className="mr-1 text-[var(--text)]">Имаш профил?</span>
          <Button
            variant="link"
            className="p-0 h-auto font-semibold text-[var(--primary)]"
            onClick={onFlip}
            type="button"
          >
            Најави се!
          </Button>
        </div>
      </form>
    </Form>
  );
}
