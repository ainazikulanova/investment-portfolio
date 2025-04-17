import { useState } from "react";

function Education() {
  const terms = [
    {
      title: "Инвестиционный портфель",
      definition:
        "Инвестиционный портфель — это набор активов (акции, облигации и др.), собранных инвестором для достижения финансовых целей. Состав портфеля зависит от уровня риска, который вы выбираете.",
    },
    {
      title: "Диверсификация",
      definition:
        "Диверсификация — это стратегия распределения инвестиций между различными активами или классами активов для снижения общего риска портфеля. Например, вложение в акции, облигации и недвижимость одновременно.",
    },
    {
      title: "Модель Марковица",
      definition:
        "Модель Марковица — это теория портфельного инвестирования, разработанная Гарри Марковицем. Она помогает инвесторам оптимизировать портфель, минимизируя риски и максимизируя доходность через диверсификацию.",
    },
    {
      title: "Модель Шарпа",
      definition:
        "Модель Шарпа, или коэффициент Шарпа, измеряет доходность портфеля на единицу риска. Чем выше коэффициент, тем лучше портфель компенсирует риск.",
    },
    {
      title: "Коэффициент бета",
      definition:
        "Коэффициент бета измеряет волатильность актива или портфеля по сравнению с рынком в целом. Бета больше 1 означает, что актив более волатилен, чем рынок, а бета меньше 1 — менее волатилен.",
    },
    {
      title: "Альфа портфеля",
      definition:
        "Альфа портфеля показывает избыточную доходность портфеля по сравнению с ожидаемой доходностью, рассчитанной с учетом риска (например, через модель CAPM). Положительная альфа указывает на успешное управление портфелем.",
    },
  ];

  const Term = ({ title, definition }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="bg-white rounded-lg shadow-md mb-4">
        <div
          className="flex justify-between items-center p-4 cursor-pointer font-bold text-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{title}</span>
          <span>{isOpen ? "▼" : "✖"}</span>
        </div>
        {isOpen && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {definition}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="max-w-2xl w-full mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Образование</h1>
      <div className="space-y-4">
        {terms.map((term, index) => (
          <Term key={index} title={term.title} definition={term.definition} />
        ))}
      </div>
    </section>
  );
}

export default Education;
