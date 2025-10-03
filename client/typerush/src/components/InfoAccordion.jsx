import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import GlassCard from "../components/global/GlassCard";
import {
  UserPlus,
  DoorOpen,
  ToggleLeft,
  PlayCircle,
  Keyboard,
  Award,
  FolderPlus,
  Layers,
  Gamepad2,
  FolderOpen,
  SendHorizontal,
  Star,
} from "lucide-react";

export default function InfoAccordion() {
  const steps = [
    {
      icon: UserPlus,
      title: "Најави се",
      text: "Регистрирај сметка со е-пошта",
      color: "text-[var(--accent)] bg-[var(--accent)]/20",
    },
    {
      icon: DoorOpen,
      title: "Креирај или влези во соба",
      text: "Домаќинот креира соба, другите влегуваат со код",
      color: "text-[var(--secondary)] bg-[var(--secondary)]/20",
    },
    {
      icon: ToggleLeft,
      title: "Избери режим на игра",
      text: "Стандарден или „Стоп“ режим",
      color: "text-[var(--accent)] bg-[var(--accent)]/20",
    },
    {
      icon: PlayCircle,
      title: "Започни рунда",
      text: "Секој ќе добие иста буква и категории",
      color: "text-[var(--secondary)] bg-[var(--secondary)]/20",
    },
    {
      icon: Keyboard,
      title: "Пополни одговори",
      text: "Внеси зборови што почнуваат на генерираната буква",
      color: "text-[var(--accent)] bg-[var(--accent)]/20",
    },
    {
      icon: Award,
      title: "Освои поени",
      text: "Точни и уникатни одговори носат повеќе поени.",
      color: "text-[var(--secondary)] bg-[var(--secondary)]/20",
    },
  ];

  const categoriesInfo = [
    {
      icon: Layers,
      title: "Основни категории",
      text: "Додадени од администраторите и достапни во сите соби.",
      color: "text-[var(--secondary)] bg-[var(--secondary)]/20",
    },
    {
      icon: FolderPlus,
      title: "Категории од играчите",
      text: "Можеш да внесеш своја категорија со зборови одделени со запирка и таа веднаш ќе биде достапна во собата што ќе ја креираш.",
      color: "text-[var(--accent)] bg-[var(--accent)]/20",
    },
  ];

  // Унифициран стил за иконите на секциите
  const sectionIcon = (Icon, colorClass) => (
    <div
      className={`flex justify-center items-center rounded-full w-8 h-8 shrink-0 ${colorClass}`}
    >
      <Icon className="w-5 h-5" />
    </div>
  );

  return (
    <GlassCard className="flex-col flex-1/3 gap-2 p-4 h-full">
      <h2 className="mb-2 font-bold text-[var(--primary)] text-xl">
        За Играта
      </h2>
      <Accordion type="single" collapsible>
        {/* How to play */}
        <AccordionItem value="howto">
          <AccordionTrigger className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary)]/50 text-lg transition-colors">
            {sectionIcon(PlayCircle, "text-[var(--accent)] bg-[var(--accent)]/20")}
            Како да играш
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-4">
              {steps.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 p-2 rounded-lg transition"
                >
                  <div
                    className={`flex justify-center items-center rounded-full w-8 h-8 shrink-0 ${s.color}`}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--primary)] text-sm">
                      {s.title}
                    </p>
                    <p className="text-[var(--text)]/80 text-xs">{s.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Modes */}
        <AccordionItem value="modes">
          <AccordionTrigger className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary)]/50 text-lg transition-colors">
            {sectionIcon(Gamepad2, "text-[var(--secondary)] bg-[var(--secondary)]/20")}
            Модови
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 p-3 rounded-lg transition">
              <h3 className="font-semibold text-[var(--secondary)]">
                Стандарден
              </h3>
              <p className="text-[var(--text)]/80 text-sm">
                Рундата завршува кога ќе истече времето или кога сите играчи
                испратиле одговор.
              </p>
            </div>

            <div className="bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 p-3 rounded-lg transition">
              <h3 className="font-semibold text-[var(--accent)]">Стоп</h3>
              <p className="text-[var(--text)]/80 text-sm">
                Играчот што прв ќе ги пополни сите полиња може да ја прекине
                рундата веднаш и да започне бодувањето.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary)]/50 text-lg transition-colors">
            {sectionIcon(FolderOpen, "text-[var(--accent)] bg-[var(--accent)]/20")}
            Категории
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-4">
              {categoriesInfo.map((c, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 p-2 rounded-lg transition"
                >
                  <div
                    className={`flex justify-center items-center rounded-full w-8 h-8 shrink-0 ${c.color}`}
                  >
                    <c.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--primary)] text-sm">
                      {c.title}
                    </p>
                    <p className="text-[var(--text)]/80 text-xs">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Suggest Words */}
        <AccordionItem value="suggestions">
          <AccordionTrigger className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary)]/50 text-lg transition-colors">
            {sectionIcon(SendHorizontal, "text-[var(--secondary)] bg-[var(--secondary)]/20")}
           Предложи збор
          </AccordionTrigger>
          <AccordionContent>
            <div className="bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 p-3 rounded-lg transition">
              <p className="text-[var(--text)]/80 text-sm">
                Во текот на играта, доколку сметаш дека одреден збор треба да
                биде додаден во категоријата за конкретната буква, можеш да го
                испратиш како предлог за преглед. Предлогот автоматски се праќа
                до администраторот, кој одлучува дали ќе го одобри и додаде во
                официјалната листа на зборови.
              </p>
              <p className="text-[var(--text)]/80 text-sm mt-2">
                Меѓу рундите, играчите можат да гласаат дали го прифаќаат
                одговорот — ако повеќето го одобрат, играчот што го предложил
                може да добие бонус од{" "}
                <span className="font-semibold text-[var(--accent)]">
                  +5 поени
                </span>
                .
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Points and Levels */}
        <AccordionItem value="levelup">
          <AccordionTrigger className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary)]/50 text-lg transition-colors">
            {sectionIcon(Star, "text-[var(--accent)] bg-[var(--accent)]/20")}
            Поени и Нивоа
          </AccordionTrigger>
          <AccordionContent>
            <div className="bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 p-3 rounded-lg transition">
              <p className="text-[var(--text)]/80 text-sm">
                По завршување на секоја игра сите играчи добиваат поени врз
                основа на своите резултати. Со собирање на поени се качуваш на
                повисоки нивоа кои ја прикажуваат твојата активност и искуство
                во играта.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </GlassCard>
  );
}
