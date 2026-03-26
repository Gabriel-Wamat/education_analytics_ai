import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ExamDashboardPage } from "@/pages/exam-dashboard-page";
import { renderWithProviders } from "@/test/utils";

describe("ExamDashboardPage", () => {
  it("keeps the dashboard available with empty charts when no exam id is provided", async () => {
    renderWithProviders(
      <div style={{ width: 1280, minHeight: 900 }}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<ExamDashboardPage />} />
          </Routes>
        </MemoryRouter>
      </div>
    );

    expect(
      await screen.findByText(
        "O dashboard já está disponível. Assim que você corrigir uma turma, os gráficos serão preenchidos automaticamente."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "O gráfico será preenchido assim que houver dados corrigidos para comparar desempenho por questão."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Quando houver dados corrigidos, cada unidade aparecerá com uma linha própria neste gráfico."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Distribuição ainda não disponível")).toBeInTheDocument();
  });
});
