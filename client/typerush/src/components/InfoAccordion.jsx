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
} from "lucide-react";

export default function InfoAccordion() {
  const steps = [
    {
      icon: UserPlus,
      title: "Најави се",
      text: "Регистрирај сметка со е-пошта",
    },
    {
      icon: DoorOpen,
      title: "Креирај или влези во соба",
      text: "Домаќинот креира соба, другите влегуваат со код",
    },
    {
      icon: ToggleLeft,
      title: "Избери режим на игра",
      text: "Стандарден или „Стоп“ режим",
    },
    {
      icon: PlayCircle,
      title: "Започни рунда",
      text: "Секој ќе добие иста буква и категории",
    },
    {
      icon: Keyboard,
      title: "Пополни одговори",
      text: "Внеси зборови што почнуваат на генерираната буква",
    },
    {
      icon: Award,
      title: "Освои поени",
      text: "Точни и уникатни одговори носат повеќе поени, мали грешки се простуваат",
    },
  ];

  return (
    <GlassCard className="flex flex-col gap-1 p-4">
      <h2 className="font-bold text-[var(--primary)] text-xl">За Играта</h2>
      <Accordion type="single" collapsible>
        {/* How to play */}
        <AccordionItem value="howto">
          <AccordionTrigger className="text-[var(--primary)]">
            Како да играш
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-3">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-1">
                  <s.icon className="w-5 h-5 text-[var(--primary)] shrink-0" />
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
          <AccordionTrigger className="text-[var(--primary)]">
            Модови
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--secondary)]">
                Стандарден
              </h3>
              <p className="text-[var(--text)]/80 text-sm">
                Рундата завршува кога ќе истече времето или кога сите играчи
                испратиле одговор.
              </p>
            </div>

            <div>
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
          <AccordionTrigger className="text-[var(--primary)]">
            Категории
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <div className="flex items-start gap-2">
              <FolderPlus className="w-5 h-5 text-[var(--primary)] shrink-0" />
              <p className="text-[var(--text)]/80 text-sm">
                Играта има <b>основни категории</b> (додадени од админ) и{" "}
                <b>категории додадени од играчите</b>.
              </p>
            </div>
            <p className="text-[var(--text)]/80 text-sm">
              Во делот<b>Додади категорија</b> можеш да внесеш нова
              категорија со зборови одделени со запирка. Таа веднаш ќе биде
              достапна во собата што ќе ја креираш.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </GlassCard>
  );
}
