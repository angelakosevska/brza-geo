import {
  UserPlus,
  DoorOpen,
  PlayCircle,
  Keyboard,
  Award,
  ToggleLeft,
} from "lucide-react";

// export default function HowToPlay({ columns = 1 }) {
//   const steps = [
//     {
//       icon: <UserPlus className="w-8 h-8 text-[var(--primary)]" />,
//       title: "Најави се",
//       text: "Регистрирај сметка со е-пошта",
//     },
//     {
//       icon: <DoorOpen className="w-8 h-8 text-[var(--primary)]" />,
//       title: "Креирај или влези во соба",
//       text: "Домаќинот креира соба и одредува опции, другите влегуваат со код.",
//     },
//     {
//       icon: <ToggleLeft className="w-8 h-8 text-[var(--primary)]" />,
//       title: "Избери мод",
//       text: "Стандарден: рундата завршува кога сите испратиле или времето истече.       „Стоп“: првиот што пополнува може да ја прекине рундата.",
//     },
//     {
//       icon: <PlayCircle className="w-8 h-8 text-[var(--primary)]" />,
//       title: "Започни рунда",
//       text: "Секој ќе добие буква и категории кои треба да ги пополни во одредено време.",
//     },
//     {
//       icon: <Keyboard className="w-8 h-8 text-[var(--primary)]" />,
//       title: "Пополни одговори",
//       text: "Внеси зборови што почнуваат со буквата.",
//     },

//     {
//       icon: <Award className="w-8 h-8 text-[var(--primary)]" />,
//       title: "Освој поени",
//       text: "Точни и уникатни одговори носат повеќе поени.",
//     },
//   ];

//   return (
//     <div className="flex flex-col justify-center items-center w-full h-full text-[var(--text)]">
//       <h2 className="mb-6 font-bold text-[var(--primary)] text-2xl text-center">
//         Како да играш
//       </h2>

//       <div
//         className={`grid gap-4 w-full max-w-2xl ${
//           columns === 2 ? "md:grid-cols-2" : "grid-cols-1"
//         }`}
//       >
//         {steps.map((step, idx) => (
//           <div
//             key={idx}
//             className="flex flex-col items-center gap-3 bg-[var(--primary)]/10 shadow-sm backdrop-blur-2xl p-4 border border-[var(--background)]/5 rounded-3xl text-center"
//           >
//             <div>{step.icon}</div>
//             <h3 className="font-semibold text-[var(--primary)] text-lg">
//               {step.title}
//             </h3>
//             <p className="opacity-80 text-sm">{step.text}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

export default function HowToPlay({ columns = 1 }) {
  const steps = [
    {
      icon: UserPlus,
      title: "Најави се",
      text: "Регистрирај сметка со е-пошта.",
    },
    {
      icon: DoorOpen,
      title: "Креирај или влези во соба",
      text: "Домаќинот креира соба, другите влегуваат со код.",
    },
    {
      icon: ToggleLeft,
      title: "Избери мод",
      text: "Стандарден или „Стоп“ мод со различен крај.",
    },
    {
      icon: PlayCircle,
      title: "Започни рунда",
      text: "Секој добива буква и категории со тајмер.",
    },
    {
      icon: Keyboard,
      title: "Пополни одговори",
      text: "Внеси зборови што почнуваат со буквата.",
    },
    {
      icon: Award,
      title: "Освој поени",
      text: "Точни и уникатни одговори носат повеќе поени.",
    },
  ];

  return (
    <div className="flex flex-col items-center w-full text-[var(--text)]">
      <h2 className="mb-6 font-bold text-[var(--primary)] text-2xl text-center">
        Како да играш
      </h2>

      <div
        className={`grid gap-4 w-full max-w-2xl ${
          columns === 2 ? "sm:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-3 bg-[var(--background)]/40 hover:bg-[var(--primary)]/10 backdrop-blur-sm p-3 border border-[var(--primary)]/20 rounded-xl transition"
            >
              {/* Icon + step number overlapped */}
              <div className="relative flex justify-center items-center">
                <div className="flex justify-center items-center bg-[var(--primary)]/15 rounded-full w-10 h-10 text-[var(--primary)]">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="-top-1 -left-2 absolute flex justify-center items-center bg-[var(--primary)] shadow rounded-full w-5 h-5 font-bold text-[var(--background)] text-xs">
                  {idx + 1}
                </span>
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--primary)] text-sm">
                  {step.title}
                </h3>
                <p className="opacity-80 text-xs">{step.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
