import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { QuestionFormModal } from "@/features/questions/question-form-modal";
import { renderWithProviders } from "@/test/utils";

describe("QuestionFormModal", () => {
  it("shows validation errors when the form is submitted empty", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <QuestionFormModal open initialQuestion={null} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Criar questão" }));

    expect(screen.getByText("Informe o tema da questão.")).toBeInTheDocument();
    expect(screen.getByText("Informe o enunciado da questão.")).toBeInTheDocument();
    expect(screen.getAllByText("Informe a descrição da alternativa.")).toHaveLength(2);
  });

  it("shows existing topics and allows extending the unit list", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <QuestionFormModal
        open
        initialQuestion={null}
        onClose={vi.fn()}
        existingTopics={["Álgebra", "Geometria"]}
        availableUnits={[1, 2, 3]}
      />
    );

    const topicInput = screen.getByRole("combobox", { name: "Tema (target)" });
    const topicSuggestionsId = topicInput.getAttribute("list");
    const topicSuggestions = document.getElementById(topicSuggestionsId ?? "");

    expect(topicSuggestions).not.toBeNull();
    expect(topicSuggestions?.querySelector('option[value="Álgebra"]')).not.toBeNull();
    expect(topicSuggestions?.querySelector('option[value="Geometria"]')).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Adicionar unidade" }));

    expect(screen.getByRole("option", { name: "Unidade 4" })).toBeInTheDocument();
  });
});
